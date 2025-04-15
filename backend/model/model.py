from llama_cpp import Llama


def generate_notes_from_transcript(transcript: str) -> str:
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
