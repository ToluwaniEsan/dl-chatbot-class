from openai import OpenAI

from app.config import settings


class GroqChatService:
    def __init__(self) -> None:
        cfg = settings()
        self.client = OpenAI(api_key=cfg["llm_api_key"], base_url=cfg["llm_base_url"])
        self.model = cfg["llm_model"]
        self.temperature = cfg["llm_temperature"]
        self.max_tokens = cfg["llm_max_tokens"]
        self.system_prompt = cfg["app_system_prompt"]

    def complete(self, messages: list[dict[str, str]]) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "system", "content": self.system_prompt}, *messages],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        reply = (response.choices[0].message.content or "").strip()
        if not reply:
            raise RuntimeError("Empty response from the language model.")
        return reply
