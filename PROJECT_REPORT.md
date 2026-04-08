# Project report: pretrained-model class chatbot

Use this document for your class presentation. Fill in bracketed placeholders and add screenshots as you go.

## 1. Team and roles

- **Members:** [Name A], [Name B], …
- **Roles:** [e.g. UI, API/RAG, documentation, evaluation]

## 2. Instructor confirmation (rubric)

- [ ] We confirmed with the instructor that **pretrained models** with **no custom training** (and optional **hosted API**) satisfy the deep-learning project requirements.
- **Required theory / evaluation notes from instructor:** [paste here]

## 3. Goal

- **Audience:** [e.g. students in course X]
- **Purpose:** [what problem the bot solves]

## 4. Architecture

- **Browser:** Next.js (App Router) chat UI calls `POST /api/chat` on the same origin.
- **Server:** Next.js Route Handler builds the **system prompt** and calls the **Groq** chat completions API.
- **Model:** Pretrained LLM weights (hosted or local); optional pretrained **embedding** model for RAG.

You may paste a screenshot of the UI here or reproduce the diagram from the project plan.

## 5. Model choice (model card summary)

- **Provider / runtime:** [Groq / Ollama / other]
- **Chat model id:** [e.g. llama-3.1-8b-instant, llama3.2, …]
- **Embedding model id (if RAG):** [e.g. text-embedding-3-small, nomic-embed-text]
- **Link to official model or API documentation:** [URL]
- **Scale (from docs):** [parameter count / family description in one sentence—cite the vendor page]

## 6. Integration and security

- **API keys** live only in `.env.local` on the server; the browser never sees them.
- **Request body:** `{ "messages": [{ "role": "user"|"assistant", "content": "..." }] }`
- **Response body:** `{ "reply": string }`

## 7. Prompting and settings

- **System prompt strategy:** [describe tone, constraints, citation behavior]
- **Temperature / max tokens:** [values from `.env.local`]
- **RAG:** currently disabled in code.

## 8. Evaluation

- **Test questions (fixed set):** [list 5–10]
- **Observations:** [e.g. answer quality, where the model hallucinates]
- **Latency / cost notes (if using a paid API):** [brief]

## 9. Limitations and ethics

- LLMs can **hallucinate**.
- **Privacy:** avoid sensitive data in prompts if using external APIs.
- **Not** for medical, legal, or emergency use unless explicitly designed and reviewed for that.

## 10. How to run locally

1. Install [Node.js](https://nodejs.org/) (LTS).
2. Copy `.env.example` to `.env.local` and set variables for your provider.
3. From the project root:

```bash
npm install
npm run dev
```

4. Open `http://localhost:3000`.

**Ollama example:** run `ollama serve`, pull models (e.g. `ollama pull llama3.2` and an embedding model such as `nomic-embed-text`), then set `LLM_BASE_URL=http://localhost:11434/v1`, `LLM_API_KEY=ollama`, `LLM_MODEL=llama3.2`, `EMBEDDING_MODEL=nomic-embed-text`.

## 11. References

- [Next.js](https://nextjs.org/docs)
- [Groq API](https://console.groq.com/docs)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md) (if applicable)
