from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import shutil
import os
import datetime
from multiprocessing import Process, Queue

from audio.audio import TranscriptionMethod
from model.model import NotesMethod

from db.db_setup import AudioSession, Output, SessionLocal, setup_db
from db.db_util import add_dummy_data, view_db

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello voice ai"}


# Path to save the uploaded audio temporarily
# TODO: save to a db correctly, probably not can remove the tempfile and send the filename directly to the function
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# TODO: make it accept the query options to be used later
def transcribe_worker(q, file_path, method):
    from audio.audio import transcribe_mp3

    result = transcribe_mp3(file_path, method)
    q.put(result)


def notes_worker(q, transcription, method):
    from model.model import generate_notes_from_transcript

    result = generate_notes_from_transcript(transcription, method)
    q.put(result)


# DEPRECATED: use only for local testing
@app.post("/api/transcribe-audio/")
async def transcribe_audio(
    file: UploadFile = File(),
    method: TranscriptionMethod = TranscriptionMethod.alibaba_asr_api,
):
    """
    to check this route use this curl cmd with a sample file
    ``sh
    curl -X POST localhost:5000/api/transcribe-audio/ \
        -F "file=@voice_sample.mp3" \
        -F "method=alibaba_asr_api" \
        -H "Content-Type: multipart/form-data"
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
    transcription_method: TranscriptionMethod = TranscriptionMethod.alibaba_asr_api,
    notes_method: NotesMethod = NotesMethod.deepseek_openrouter_api,
    session_name: str = Query(default="default-session-name"),
    query_lang: str = Query(default="default-query-lang"),
    query_prompt: str = Query(default="default-query-prompt"),
    query_audio_kind: str = Query(default="default-query-audio-kind"),
):
    """
    Does both transcription and notes generation, and returns both.
    Usage:
    ``sh
    curl -X POST "localhost:5000/api/transcribe-and-generate-notes/?session_id=XXX&session_name=XXX&query_lang=XXX" \
        -F "file=@voice_sample.mp3" \
        -F "transcription_method=alibaba_asr_api" \
        -F "notes_method=deepseek_openrouter_api" \
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
        target=transcribe_worker, args=(transcribe_q, file_path, transcription_method)
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

    sessions = db.query(
        AudioSession
    ).all()  # or use await db.execute(select(AudioSession)) in async setup

    db.close()

    return sessions


if __name__ == "__main__":
    import uvicorn

    # Run the DB setup (this will create tables)
    setup_db()

    add_dummy_data()
    view_db()

    uvicorn.run("main:app", host="localhost", port=5000, log_level="info")
