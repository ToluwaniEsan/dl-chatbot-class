from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.schemas import ChatRequest, ChatResponse
from app.services.groq import GroqChatService
from app.services.tavily import search_web

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title=settings()["app_title"])
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
chat_service = GroqChatService()


@app.get("/", response_class=HTMLResponse)
async def home(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "app_title": settings()["app_title"],
        },
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> JSONResponse:
    messages = [message.model_dump() for message in payload.messages]
    query = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")

    search_results = await search_web(query)
    if search_results:
        search_context = "\n\n".join(
            f"{i + 1}. {item['title']}\nSource: {item['url']}\n{item['content']}"
            for i, item in enumerate(search_results)
        )
        messages = [
            {
                "role": "system",
                "content": (
                    "Use the following web results internally to answer accurately. "
                    "Do not include source lists or URLs unless the user explicitly asks for them.\n\n"
                    f"{search_context}"
                ),
            },
            *messages,
        ]

    reply = chat_service.complete(messages)
    return JSONResponse({"reply": reply})
