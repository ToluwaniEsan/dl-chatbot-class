# Class chatbot (pretrained LLM)

A **Next.js** web app that chats with a **pretrained language model** through any **OpenAI-compatible HTTP API** (no custom model training in this repo). The UI is a **React** client; the browser talks to a **Route Handler** at `POST /api/chat`, which forwards prompts to your chosen provider (cloud API or local **Ollama**).

Built for coursework where the goal is to use **deep learning inference** on existing checkpoints—hosted or local—not to train models from scratch.

## Features

- **Chat UI** with a maroon / cream / black layout; message history and streaming-free completion responses.
- **Multimodal input**: attach **images** (vision-capable models) and **documents** (PDF extracted server-side, plus plain text / Markdown / CSV). PDF text uses [pdf-parse](https://www.npmjs.com/package/pdf-parse).
- **Optional RAG**: retrieve chunks from `data/corpus` (`.md` / `.txt`), embed the query and documents, inject top matches into the system prompt. Toggle with `RAG_ENABLED` in `.env.local`.
- **Provider-agnostic**: set `OPENAI_BASE_URL`, `OPENAI_API_KEY`, and `OPENAI_MODEL` for OpenAI, DeepSeek, Groq, Ollama’s OpenAI-compat endpoint, etc.

## Stack

- **Next.js 15** (App Router), **React 19**, **TypeScript**, **Tailwind CSS v4**
- **openai** SDK (OpenAI-compatible servers)
- **pdf-parse** (server-side PDF text for uploads)

## Quick start

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in your provider (see comments in `.env.example`).
4. Run the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

### Local Ollama

If you use `OPENAI_BASE_URL=http://localhost:11434/v1` and `OPENAI_API_KEY=ollama`, run **Ollama** on the same machine and `ollama pull` the chat model (and an embedding model if `RAG_ENABLED=true`). For **images**, use a **vision** model supported by your stack.

### Cloud-only (no Ollama on that PC)

Point `OPENAI_BASE_URL` and `OPENAI_API_KEY` at a hosted API and choose a chat model id that provider supports. You only need Node and this repo on the machine running `npm run dev`.

## Project layout (short)

| Path | Role |
|------|------|
| `src/app/page.tsx` | Chat UI (React client) |
| `src/app/api/chat/route.ts` | Validates requests, normalizes uploads, calls the LLM |
| `src/lib/llm.ts` | Embeddings (RAG), chat completion, multimodal message mapping |
| `src/lib/rag.ts` | Corpus chunking and cosine similarity |
| `data/corpus/` | Optional RAG source files |
| `PROJECT_REPORT.md` | Class report / presentation template |

## Scripts

- `npm run dev` — development server (Turbopack)
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Security note

Never commit **`.env.local`** or real API keys. Copy variables from **`.env.example`** into your local env file only.

## License

Private / class use unless you add an explicit license.
