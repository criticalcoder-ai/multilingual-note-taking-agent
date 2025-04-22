from fastapi import FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import shutil
import os
import datetime
from typing import Optional
from multiprocessing import Process, Queue

from sqlalchemy import desc, or_, case

from audio.audio import TranscriptionMethod
from model.model import NotesMethod

from db.db_setup import AudioSession, Output, SessionLocal, setup_db
from db.db_util import add_dummy_data, view_db
from sqlalchemy.orm import joinedload

app = FastAPI()


@app.get("/hello")
async def root():
    return {"message": "Hello voice ai"}


# Path to save the uploaded audio temporarily
# TODO: save to a db correctly, probably not can remove the tempfile and send the filename directly to the function
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# TODO: make it accept the query options to be used later
def transcribe_worker(
    q, file_path, method, query_lang=None, query_prompt=None, query_audio_kind=None
):
    from audio.audio import transcribe_mp3

    result = transcribe_mp3(
        file_path,
        method,
        query_lang=query_lang,
        query_prompt=query_prompt,
        query_audio_kind=query_audio_kind,
    )
    q.put(result)


def notes_worker(q, transcription, method):
    from model.model import generate_notes_from_transcript

    result = generate_notes_from_transcript(transcription, method)
    q.put(result)


# DEPRECATED: use only for local testing
@app.post("/api/transcribe-audio/")
async def transcribe_audio(
    file: UploadFile = File(),
    method: TranscriptionMethod = Query(default=TranscriptionMethod.alibaba_asr_api),
):
    """
    to check this route use this curl cmd with a sample file
    ``sh
    curl -X POST localhost:5000/api/transcribe-audio/?method=alibaba_asr_api \
        -F "file=@voice_sample.mp3" \
    ``
    """

    print(f"transcribe_audio route called with {file=}, {method=}")

    if file.filename is None:
        return JSONResponse(
            status_code=400, content={"error": "filename cannot be None"}
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 1: Run transcription in isolated process
    transcribe_q = Queue()
    transcribe_p = Process(
        target=transcribe_worker, args=(transcribe_q, file_path, method)
    )
    transcribe_p.start()
    transcribe_p.join()

    # Remove file
    os.remove(file_path)

    if not transcribe_q.empty():
        transcription = transcribe_q.get()
        print(f"got the transcription {transcription=}")
    else:
        raise HTTPException(status_code=500, detail="Transcription failed")

    return {"transcription": transcription}


# TODO: dummy model remove later
class TranscriptionInput(BaseModel):
    transcription_text: str


# DEPRECATED: use only for local testing
@app.post("/api/notes-from-transcription-text")
async def notes_from_transcription_text(
    input_data: TranscriptionInput,
    method: NotesMethod = NotesMethod.deepseek_openrouter_api,
):
    """
    to check notes generation from transcription only
    ``sh
    curl -X POST localhost:5000/api/notes-from-transcription-text \
        -H 'Content-Type: application/json' \
        -d '{
          "transcription_text": "jason, bond, momo, blah, blah",
          "method": "deepseek_openrouter_api"
        }'
    ``
    """
    print(f"hello from route {input_data.transcription_text=}")

    notes_q = Queue()
    notes_p = Process(
        target=notes_worker, args=(notes_q, input_data.transcription_text, method)
    )
    notes_p.start()
    notes_p.join()

    if not notes_q.empty():
        notes = notes_q.get()
    else:
        raise HTTPException(status_code=500, detail="Notes generation failed")

    return {"notes": notes}


@app.post("/api/transcribe-and-generate-notes/")
async def transcribe_and_generate_notes(
    session_id: int = Query(...),
    file: UploadFile = File(...),
    transcription_method: TranscriptionMethod = Query(
        default=TranscriptionMethod.alibaba_asr_api
    ),
    notes_method: NotesMethod = Query(default=NotesMethod.deepseek_openrouter_api),
    session_name: str = Query(default="default-session-name"),
    query_lang: str = Query(default="default-query-lang"),
    query_prompt: str = Query(default="default-query-prompt"),
    query_audio_kind: str = Query(default="default-query-audio-kind"),
):
    """
    Does both transcription and notes generation, and returns both.
    Usage:
    ``sh
    curl -X POST "localhost:5000/api/transcribe-and-generate-notes/?notes_method=dummy&transcription_method=dummy&session_id=XXX&session_name=XXX&query_lang=XXX" \
        -F "file=@voice_sample.mp3" \
        -H "Content-Type: multipart/form-data"
    ``
    """

    if not session_id:
        raise HTTPException(
            status_code=400, detail="Missing session_id in query parameters"
        )

    try:
        session_id = int(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="session_id must be an integer")

    print(f"transcribe_and_generate_notes route called with {file=}, {session_id}")

    if file.filename is None:
        return JSONResponse(
            status_code=400, content={"error": "filename cannot be None"}
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file to disk (do not delete later)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 1: Run transcription in isolated process
    transcribe_q = Queue()
    transcribe_p = Process(
        target=transcribe_worker,
        args=(
            transcribe_q,
            file_path,
            transcription_method,
            query_lang,
            query_prompt,
            query_audio_kind,
        ),
    )
    transcribe_p.start()
    transcribe_p.join()

    if not transcribe_q.empty():
        transcription = transcribe_q.get()
        print(f"got the transcription {transcription=}")
    else:
        raise HTTPException(status_code=500, detail="Transcription failed")

    # Step 2: Run notes generation in isolated process
    notes_q = Queue()
    notes_p = Process(target=notes_worker, args=(notes_q, transcription, notes_method))
    notes_p.start()
    notes_p.join()

    if not notes_q.empty():
        notes = notes_q.get()
    else:
        raise HTTPException(status_code=500, detail="Notes generation failed")

    # Database operations
    db = SessionLocal()
    try:
        audio_session = (
            db.query(AudioSession).filter(AudioSession.id == session_id).first()
        )
        if not audio_session:
            db.close()
            raise HTTPException(
                status_code=404, detail=f"No AudioSession found with id {session_id}"
            )

        # Update session fields
        audio_session.session_name = session_name
        audio_session.query_file = file.filename
        audio_session.query_lang = query_lang
        audio_session.query_prompt = query_prompt
        audio_session.query_audio_kind = query_audio_kind

        # Check for existing output in this session
        existing_output = (
            db.query(Output).filter(Output.audio_session_id == audio_session.id).first()
        )

        # Update existing output or create new if none exists
        if existing_output:
            existing_output.transcription_text = transcription
            existing_output.notes_text = notes
        else:
            output = Output(
                transcription_text=transcription,
                notes_text=notes,
                audio_session_id=audio_session.id,
            )
            db.add(output)

        # Commit changes (updates or new output)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    db.close()

    return {"transcription": transcription, "notes": notes}


@app.get("/api/audio-sessions/new", response_model=int)
async def create_empty_audio_session():
    """
    Create an empty AudioSession with default empty values and return its ID.
    ``sh
    curl -X GET localhost:5000/api/audio-sessions/new
    ``
    """
    db = SessionLocal()
    session_id = None

    try:
        # Create new session with empty required fields
        new_session = AudioSession(
            session_name="",
            query_lang="",
            query_file="",
            query_prompt="",
            query_audio_kind="",
        )

        db.add(new_session)
        db.commit()
        db.refresh(new_session)  # Refresh to get the auto-generated ID

        session_id = new_session.id

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Failed to create audio session: {str(e)}"
        )

    db.close()
    return session_id


class AudioSessionRead(BaseModel):
    id: int
    session_name: str
    created_time: datetime.datetime
    query_lang: str
    query_file: str
    query_prompt: str
    query_audio_kind: str

    class Config:
        from_attributes = True  # Pydantic v2


@app.get("/api/audio-sessions/")
async def get_audio_sessions():
    """
    Retrieve a list of all audio sessions with their details,
    excluding the output data.
    ``sh
    curl localhost:5000/api/audio-sessions/
    ``
    """
    # Query the database to get all AudioSession objects
    db = SessionLocal()

    try:
        sessions = db.query(AudioSession).all()

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

    db.close()

    return sessions


# Pydantic model for the nested Output data
class OutputRead(BaseModel):
    id: int
    created_time: datetime.datetime
    transcription_text: str
    notes_text: str
    audio_session_id: (
        int  # Include FK for clarity if needed, though often omitted in nested reads
    )

    class Config:
        from_attributes = True  # Pydantic v2


class AudioSessionDetail(BaseModel):
    id: int
    session_name: str
    created_time: datetime.datetime
    query_lang: str
    query_file: str
    query_prompt: str
    query_audio_kind: str
    # Nest the OutputRead model. Make Optional if Output can be null.
    output: Optional[OutputRead] = None

    class Config:
        from_attributes = True  # Pydantic v2


@app.get("/api/audio-sessions/{session_id}/", response_model=AudioSessionDetail)
async def get_session_detail(session_id: int):
    """
    Retrieve details for a specific audio session, including its output data,
    by the session's ID.
    ``sh
    curl localhost:5000/api/audio-sessions/XX/
    ``
    """
    db = SessionLocal()

    try:
        # Query the database for the specific AudioSession by its ID
        # Use joinedload to eagerly load the related 'output' data in the same query
        # This avoids a separate query for the output data later (N+1 problem)
        session = (
            db.query(AudioSession)
            .options(joinedload(AudioSession.output))
            .filter(AudioSession.id == session_id)
            .first()
        )  # Use .first() as ID should be unique

        # If no session is found with the given ID, raise a 404 Not Found error
        if session is None:
            raise HTTPException(
                status_code=404, detail=f"Audio session with id {session_id} not found"
            )

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

    db.close()

    # FastAPI will automatically serialize the 'session' object
    # using the 'AudioSessionDetail' Pydantic model, including the nested 'output'.
    return session


@app.get("/api/outputs/search/")
async def search_audio_sessions(search_text: str = Query(..., min_length=1)):
    """
    Search audio sessions by text in transcription or notes
    Returns list of AudioSessions that contain the search text in their output
    ``sh
    curl "localhost:5000/api/outputs/search/?search_text=XXX"
    ``
    """
    if not search_text.strip():
        return []

    db = SessionLocal()

    search_pattern = f"%{search_text}%"

    # Calculate match score (1 point per matching field)
    field_score = case(
        (
            Output.transcription_text.ilike(search_pattern),
            1,
        ),
        else_=0,
    ) + case(
        (
            Output.notes_text.ilike(search_pattern),
            1,
        ),
        else_=0,
    )

    try:
        results = (
            db.query(AudioSession)
            .join(Output)
            .filter(
                or_(
                    Output.transcription_text.ilike(search_pattern),
                    Output.notes_text.ilike(search_pattern),
                )
            )
            # TODO: this is a diy method to get ranking - change to good method later
            .order_by(
                desc(field_score),  # Primary sort: most matching fields
                desc(AudioSession.created_time),  # Secondary sort: newest first
            )
            .all()
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

    db.close()

    return results


# TODO: sometimes all of these fails - there could be redundancy too,  modify later
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

app.mount(
    "/assets",
    StaticFiles(directory=os.path.join(frontend_dist, "assets")),
    name="assets",
)
app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")


@app.get("/{full_path:path}")
async def serve_react(full_path: str, request: Request):
    # Return the index.html file for all client-side routes
    return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    import sys
    import os

    # Run the DB setup (this will create tables)
    setup_db()

    add_dummy_data()
    view_db()

    is_prod = "--prod" in sys.argv
    host = "0.0.0.0" if is_prod else "localhost"
    port = int(os.environ.get("PORT", 5000)) if is_prod else 5000
    log_level = "info"

    uvicorn.run("main:app", host=host, port=port, log_level=log_level)
