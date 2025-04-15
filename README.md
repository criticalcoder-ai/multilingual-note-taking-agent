# multilingual_note_taking_agent
Voice AI

# installed packages

## backend
- fastapi
- openai-whisper
- llama-cpp-python (install with CUDA backend if possible - for best performance)
    - https://github.com/abetlen/llama-cpp-python?tab=readme-ov-file#supported-backends
    - https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cuda

# how to setup?

## prerequisites
- ffmpeg - installed locally
- rust - installation maybe required for whisper - https://github.com/openai/whisper?tab=readme-ov-file#setup
- download required models to `gguf_models/` dir in base repo

## backend
- `git clone <repo>`
- `cd <repo>/backend`
- `pip install virtualenv` (if you don't already have virtualenv installed)
- `virtualenv venv` to create your new environment
- `source venv/bin/activate` to enter the virtual environment(automatic if used direnv with envrc)
- `pip install -r requirements.txt` to install the requirements in the current environment
    - llama-cpp-python might need special reinstallation for setting up gpu backend correctly

# how to run?

## backend
- `cd <repo>/backend`
- `python main.py`
