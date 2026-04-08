from functools import lru_cache
import os

from dotenv import load_dotenv

load_dotenv()


@lru_cache(maxsize=1)
def settings() -> dict[str, str | float | int]:
    return {
        "llm_api_key": os.getenv("LLM_API_KEY", "").strip(),
        "llm_base_url": os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1").strip().rstrip("/"),
        "llm_model": os.getenv("LLM_MODEL", "llama-3.1-8b-instant").strip(),
        "llm_temperature": float(os.getenv("LLM_TEMPERATURE", "0.7")),
        "llm_max_tokens": int(os.getenv("LLM_MAX_TOKENS", "512")),
        "tavily_api_key": os.getenv("TAVILY_API_KEY", "").strip(),
        "app_title": os.getenv("APP_TITLE", "Python Chatbot").strip(),
        "app_system_prompt": os.getenv(
            "APP_SYSTEM_PROMPT",
            "You are a helpful assistant for a class project chatbot. Keep replies brief and natural. For greetings, respond with one short sentence. For factual questions, answer concisely. Do not include source lists or URLs unless the user explicitly asks for sources.",
        ).strip(),
    }
