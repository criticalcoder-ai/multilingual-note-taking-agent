try:
    from llama_cpp import Llama
except ImportError:
    Llama = None

from enum import Enum

import os
import json
import requests
from dotenv import load_dotenv


# Enum for transcription method
class NotesMethod(str, Enum):
    llama_cpp_local = "llama_cpp_local"
    deepseek_openrouter_api = "deepseek_openrouter_api"
    dummy = "dummy"


def generate_notes_from_transcript_llama_cpp_local(transcript: str) -> str:
    if Llama is None:
        raise ImportError("Whisper module is not installed.")

    llm = Llama(
        # model_path="../gguf_models/Qwen2.5-7B-Instruct-Q5_K_M/qwen2.5-7b-instruct-q5_k_m.gguf",
        model_path="../gguf_models/DeepSeek-R1-Distill-Llama-8B-Q4_K_M.gguf",
        # model_path="../gguf_models/DeepSeek-R1-Distill-Qwen-7B-Q5_K_M.gguf",
        n_gpu_layers=32,  # Uncomment to use GPU acceleration
        n_ctx=1024,  # Uncomment to increase the context window
        n_threads=8,  # Matches your 8-core CPU
        n_threads_batch=16,  # Utilize all 16 threads for batch processing
        n_batch=512,  # Good balance for GPU memory (RTX 2060)
        seed=1337,
        temperature=0.4,  # More deterministic output for note-taking
        top_p=0.9,  # Balanced creativity vs focus
        verbose=False,  # Disable verbose output unless debugging
    )

    output = llm(
        prompt=f"""Q: Convert the below transcription to organized notes
        - just output the final notes - do not output your thinking
        ---
        {transcript}
        ---
        A: """,  # Prompt
        max_tokens=1024,  # Generate up to 32 tokens, set to None to generate up to the end of the context window
        stop=[
            "Q:",
            # "\n\n",
        ],  # Stop generating just before the model would generate a new question
        echo=False,  # Echo the prompt back in the output
    )  # Generate a completion, can also call create_completion

    if not isinstance(output, dict):
        raise TypeError(
            f"Expected CreateCompletionResponse dict, got {type(output).__name__}"
        )

    return output["choices"][0]["text"]


def generate_notes_from_transcript_deepseek_openrouter_api(transcript: str) -> str:
    load_dotenv()

    print(f"hello from openrouter deepseek api call, {transcript=}")

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY not found in .env")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        # "HTTP-Referer": "https://example.com",  # optional
        # "X-Title": "Transcript Note Taker",  # optional
    }

    prompt = (
        "Convert the following transcript into organized, structured notes:\n\n"
        f"{transcript}\n\n"
        "Make sure the notes are clear, concise, in english and well-formatted with bullet points or headings where needed. "
        "Only output the final notes - no talking"
    )

    payload = {
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [{"role": "user", "content": prompt}],
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    print(f"got {response=}")

    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"].strip()
    else:
        raise RuntimeError(f"Request failed: {response.status_code} - {response.text}")


def generate_notes_from_transcript(
    transcript: str, method: NotesMethod = NotesMethod.deepseek_openrouter_api
) -> str:
    notes = ""

    if method == NotesMethod.llama_cpp_local:
        notes = generate_notes_from_transcript_llama_cpp_local(transcript)
    elif method == NotesMethod.deepseek_openrouter_api:
        notes = generate_notes_from_transcript_deepseek_openrouter_api(transcript)
    elif method == NotesMethod.dummy:
        notes = "dummy transcript"
    else:
        assert 0

    return notes
