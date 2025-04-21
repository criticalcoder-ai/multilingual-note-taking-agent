import whisper

import os
import requests
from enum import Enum
from dotenv import load_dotenv


# Enum for transcription method
class TranscriptionMethod(str, Enum):
    whisper = "whisper"
    alibaba_asr_api = "alibaba_asr_api"
    dummy = "dummy"


def transcribe_with_whisper(
    path: str, query_lang=None, query_prompt=None, query_audio_kind=None
) -> str:
    model = whisper.load_model("turbo")

    # Build initial_prompt from parameters with null checking
    initial_prompt_parts = []
    if query_prompt is not None:
        initial_prompt_parts.append("user prompt: ")
        initial_prompt_parts.append(query_prompt)
    if query_lang is not None:
        initial_prompt_parts.append("lang: ")
        initial_prompt_parts.append(query_lang)
    if query_audio_kind is not None:
        initial_prompt_parts.append("audio_kind: ")
        initial_prompt_parts.append(query_audio_kind)
    initial_prompt = ", ".join(initial_prompt_parts) if initial_prompt_parts else None

    # TODO: fill the decode_options field with correct terms to work correctly
    result = model.transcribe(
        audio=path,
        word_timestamps=True,  # TODO: timestamps are not coming in the output check the code for this
        initial_prompt=initial_prompt,
    )
    text = result.get("text")

    if not isinstance(text, str):
        raise TypeError(
            f"Expected transcription to be a string, got {type(text).__name__}"
        )

    print(f"transcribed the mp3 {text=}")
    return text


def transcribe_with_alibaba_asr_api(path: str) -> str:
    load_dotenv()
    appkey = os.getenv("ALIBABA_ASR_APPKEY")
    token = os.getenv("ALIBABA_ASR_TOKEN")

    # TODO: pcm is for wav files --might need to change according to files
    format = "pcm"

    url = (
        # f"https://nls-gateway-ap-southeast-1.aliyuncs.com/stream/v1/asr"
        f"https://nls-gateway-cn-shanghai.aliyuncs.com/stream/v1/asr"
        f"?appkey={appkey}&format={format}&sample_rate=16000"
        f"&enable_punctuation_prediction=true&enable_inverse_text_normalization=true"
    )
    headers = {
        "X-NLS-Token": token,
        "Content-Type": "application/octet-stream",
    }

    with open(path, "rb") as audio_file:
        data = audio_file.read()

    response = requests.post(url, headers=headers, data=data)

    if response.status_code != 200:
        print(f"API Error: {response.status_code} {response.text}")
        response.raise_for_status()

    result = response.json()
    if result.get("status") == 20000000:
        text = result.get("result", "")
    else:
        text = f"Error: {result.get('message', 'Unknown error')}"

    print(f"transcribed the audio {text=}")
    return text


def transcribe_mp3(
    path: str,
    method: TranscriptionMethod = TranscriptionMethod.alibaba_asr_api,
    query_lang=None,
    query_prompt=None,
    query_audio_kind=None,
) -> str:
    transcription = ""

    if method == TranscriptionMethod.whisper:
        transcription = transcribe_with_whisper(
            path, query_lang, query_prompt, query_audio_kind
        )
    elif method == TranscriptionMethod.alibaba_asr_api:
        transcription = transcribe_with_alibaba_asr_api(path)
    elif method == TranscriptionMethod.dummy:
        transcription = "dummy notes"
    else:
        assert 0

    return transcription
