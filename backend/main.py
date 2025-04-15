from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from audio.audio import transcribe_mp3
from model.model import generate_notes_from_transcript

import shutil
import os
from multiprocessing import Process, Queue

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello voice ai"}


# Path to save the uploaded audio temporarily
# TODO: save to a db correctly, probably not can remove the tempfile and send the filename directly to the function
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/api/transcribe-audio/")
async def transcribe_audio(file: UploadFile = File()):
    """
    to check this route use this curl cmd with a sample file
    ``sh
    curl -X POST localhost:5000/api/transcribe-audio/ \
        -F "file=@voice_sample.mp3" \
        -H "Content-Type: multipart/form-data"
    ``
    """

    print(f"transcribe_audio route called with {file=}")

    # TODO: by default its becoming application/octet-stream for mp3 files, so find how to do this correctly
    # if file.content_type != "audio/mpeg":
    #     return JSONResponse(
    #         status_code=400, content={"error": "Only MP3 files are supported."}
    #     )

    if file.filename is None:
        return JSONResponse(
            status_code=400, content={"error": "filename cannot be None"}
        )

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save uploaded file to disk
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Call your transcription function
    transcription = transcribe_mp3(file_path)

    # Optional: remove the file after transcription
    os.remove(file_path)

    return {"transcription": transcription}


# TODO: dummy model remove later
class TranscriptionInput(BaseModel):
    transcription_text: str


@app.post("/api/notes-from-transcription-text")
async def notes_from_transcription_text(input_data: TranscriptionInput):
    """
    to check
    ``sh
    curl -X POST localhost:5000/api/notes-from-transcription-text \
        -H 'Content-Type: application/json' \
        -d '{
          "transcription_text": "jason, bond, momo, blah, blah"
        }'
    ``
    """
    print(f"hello from route {input_data.transcription_text=}")

    # TODO: probably try catch is not needed - check with llama later
    # TODO: try to add timeout for this function, seems to fail easily, takes too long
    try:
        notes = generate_notes_from_transcript(input_data.transcription_text)
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def transcribe_worker(file_path, q):
    from audio.audio import transcribe_mp3

    result = transcribe_mp3(file_path)
    q.put(result)


def notes_worker(transcription, q):
    from model.model import generate_notes_from_transcript

    result = generate_notes_from_transcript(transcription)
    q.put(result)


@app.post("/api/transcribe-and-generate-notes/")
async def transcribe_and_generate_notes(file: UploadFile = File()):
    """
    Does both transcription and notes generation, and returns both.
    Usage:
    ``sh
    curl -X POST localhost:5000/api/transcribe-and-generate-notes/ \
        -F "file=@voice_sample.mp3" \
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
    transcribe_p = Process(target=transcribe_worker, args=(file_path, transcribe_q))
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
    notes_p = Process(target=notes_worker, args=(transcription, notes_q))
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
