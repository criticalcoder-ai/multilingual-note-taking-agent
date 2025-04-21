import whisper

import os
import requests
from enum import Enum
from dotenv import load_dotenv


# Enum for transcription method
class TranscriptionMethod(str, Enum):
    whisper = "whisper"
    alibaba_asr_api = "alibaba_asr_api"


def transcribe_with_whisper(path: str) -> str:
    model = whisper.load_model("turbo")
    # TODO: fill the decode_options field with correct terms to work correctly
    result = model.transcribe(
        audio=path,
        word_timestamps=True,  # TODO: timestamps are not coming in the output check the code for this
        initial_prompt="this is my office meet recording",
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
    path: str, method: TranscriptionMethod = TranscriptionMethod.alibaba_asr_api
) -> str:
    transcription = ""

    # if method == TranscriptionMethod.whisper:
    #     transcription = transcribe_with_whisper(path)
    # elif method == TranscriptionMethod.alibaba_asr_api:
    #     transcription = transcribe_with_alibaba_asr_api(path)
    # else:
    #     assert 0
    #
    # return transcription

    return "dummy transcription"
