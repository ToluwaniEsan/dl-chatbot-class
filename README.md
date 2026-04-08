# Class Chatbot (Python FastAPI)

This repository now uses a **Python FastAPI** chatbot implementation.

The active app is in:

- `python-fastapi-chatbot/`

## Quick Start

1. Move into the Python app directory:

```bash
cd python-fastapi-chatbot
```

2. Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create your env file and fill in keys:

```bash
cp .env.example .env
```

Required:

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`

Optional:

- `TAVILY_API_KEY` (for live web search)

5. Run the app:

```bash
uvicorn app.main:app --reload
```

6. Open:

```text
http://127.0.0.1:8000
```

## Notes

- API keys stay server-side in `.env`.
- Replies are concise by default.
- Source lists/URLs are not shown unless you explicitly request them.
