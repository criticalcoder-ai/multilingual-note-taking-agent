from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import shutil
import os
from multiprocessing import Process, Queue

from audio.audio import TranscriptionMethod
from model.model import NotesMethod

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello voice ai"}


# Path to save the uploaded audio temporarily
# TODO: save to a db correctly, probably not can remove the tempfile and send the filename directly to the function
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def transcribe_worker(q, file_path, method):
    from audio.audio import transcribe_mp3

    result = transcribe_mp3(file_path, method)
    q.put(result)


def notes_worker(q, transcription, method):
    from model.model import generate_notes_from_transcript

    result = generate_notes_from_transcript(transcription, method)
    q.put(result)


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
    file: UploadFile = File(),
    transcription_method: TranscriptionMethod = TranscriptionMethod.alibaba_asr_api,
    notes_method: NotesMethod = NotesMethod.deepseek_openrouter_api,
):
    """
    Does both transcription and notes generation, and returns both.
    Usage:
    ``sh
    curl -X POST localhost:5000/api/transcribe-and-generate-notes/ \
        -F "file=@voice_sample.mp3" \
        -F "transcription_method=alibaba_asr_api" \
        -F "notes_method=deepseek_openrouter_api" \
        -H "Content-Type: multipart/form-data"
    ``
    """
    print(f"transcribe_and_generate_notes route called with {file=}")

    if file.filename is None:
        return JSONResponse(
            status_code=400, content={"error": "filename cannot be None"}
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Step 1: Run transcription in isolated process
    transcribe_q = Queue()
    transcribe_p = Process(
        target=transcribe_worker, args=(transcribe_q, file_path, transcription_method)
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

    # Step 2: Run notes generation in isolated process
    notes_q = Queue()
    notes_p = Process(target=notes_worker, args=(notes_q, transcription, notes_method))
    notes_p.start()
    notes_p.join()

    if not notes_q.empty():
        notes = notes_q.get()
    else:
        raise HTTPException(status_code=500, detail="Notes generation failed")

    return {"transcription": transcription, "notes": notes}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="localhost", port=5000, log_level="info")
