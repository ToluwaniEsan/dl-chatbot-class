# Python FastAPI Chatbot

A clean Python rewrite of the chatbot using FastAPI, Groq-compatible chat completions, and optional Tavily web search.

## Features

- FastAPI backend
- Groq-compatible chat completions
- Optional Tavily web search for current questions
- Clean browser UI served from FastAPI
- No source URLs shown in normal replies

## Setup

1. Create a virtual environment:

```bash
cd python-fastapi-chatbot
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy the env template:

```bash
cp .env.example .env
```

4. Fill in your values in `.env`:

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `TAVILY_API_KEY` (optional)

5. Run the app:

```bash
uvicorn app.main:app --reload
```

6. Open:

```text
http://127.0.0.1:8000
```

## Notes

- The Groq and Tavily keys stay on the server side.
- If Tavily is configured, the backend uses it for factual/current questions only.
- Greetings like `hi` stay short and conversational.
