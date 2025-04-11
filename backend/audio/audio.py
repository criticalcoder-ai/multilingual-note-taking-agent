import whisper


def transcribe_mp3(path: str) -> str:
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
