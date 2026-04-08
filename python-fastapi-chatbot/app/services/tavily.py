from __future__ import annotations

import httpx

from app.config import settings


SHORT_GREETINGS = {
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "thanks",
    "thank you",
}


async def search_web(query: str) -> list[dict[str, str]]:
    cfg = settings()
    api_key = cfg["tavily_api_key"]
    if not api_key:
        return []

    normalized = query.lower().strip()
    if not normalized or normalized in SHORT_GREETINGS:
        return []

    question_words = ("what", "when", "where", "why", "who", "which", "how", "latest", "news", "today", "current", "recent", "price", "weather", "update", "updates")
    if "?" not in query and not any(word in normalized for word in question_words) and len(normalized.split()) < 4:
        return []

    payload = {
        "api_key": api_key,
        "query": query,
        "include_answer": True,
        "max_results": 5,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post("https://api.tavily.com/search", json=payload)
        response.raise_for_status()
        data = response.json()

    results = data.get("results") or []
    return [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": item.get("content", ""),
        }
        for item in results
        if item.get("url")
    ]
