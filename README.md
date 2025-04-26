# multilingual_note_taking_agent
Voice AI

# installed packages

## backend
- fastapi
- openai-whisper (optional - not recommended)
- llama-cpp-python (optional - not recommended) (install with CUDA backend if possible - for best performance)
    - https://github.com/abetlen/llama-cpp-python?tab=readme-ov-file#supported-backends
    - https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cuda
- faster_whisper (optional - recommended)

# how to setup?

## prerequisites
- ffmpeg - installed locally (optional - only for openai-whisper)
- rust - installation maybe required for whisper - https://github.com/openai/whisper?tab=readme-ov-file#setup - (optional - only for openai-whisper)
- download required models to `gguf_models/` dir in base repo - (optional - only for llama-cpp-python)
- have alibaba asr keys in .env file for backend request for the model

## backend
- `git clone <repo>`
- `cd <repo>/backend`
- `pip install virtualenv` (if you don't already have virtualenv installed)
- `virtualenv venv` to create your new environment
- `source venv/bin/activate` to enter the virtual environment(automatic if used direnv with envrc)
- `pip install -r requirements.txt` to install the requirements in the current environment
    - llama-cpp-python might need special reinstallation for setting up gpu backend correctly
    - to use faster_whisper with gpu - custom installation needed - https://github.com/SYSTRAN/faster-whisper?tab=readme-ov-file#requirements

## frontend
- `npm install`

# how to run?

## backend
- `cd <repo>/backend`
- `source venv/bin/activate`
- `python main.py`
- to view frontend served from backend - run `cd frontend && npm run build`

## frontend - (also backend serves the ui from `frontend/dist` when available)
- `npm run dev`
