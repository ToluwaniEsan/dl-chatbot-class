function required(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set it.`,
    );
  }
  return v.trim();
}

export function getLlmConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim() || "ollama";
  const baseURL =
    process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
  const model =
    process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const temperature = Number(process.env.LLM_TEMPERATURE ?? "0.7");
  const maxTokens = Number(process.env.LLM_MAX_TOKENS ?? "512");
  return {
    apiKey,
    baseURL: baseURL.replace(/\/$/, ""),
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxTokens: Number.isFinite(maxTokens) ? maxTokens : 512,
  };
}

export function getEmbeddingConfig() {
  const apiKey =
    process.env.OPENAI_EMBEDDING_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "ollama";
  const baseURL = (
    process.env.OPENAI_EMBEDDING_BASE_URL?.trim() ||
    process.env.OPENAI_BASE_URL?.trim() ||
    "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model =
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  return {
    apiKey,
    baseURL,
    model,
  };
}

export function getSystemPrompt() {
  return (
    process.env.LLM_SYSTEM_PROMPT?.trim() ||
    "You are a helpful assistant for a class project that uses a pretrained language model (no custom training in this app). Answer from your knowledge. Be clear and accurate; use short paragraphs, lists, or steps when that makes the answer easier to read."
  );
}

/** Throws if API key is missing for providers that require it (not Ollama-style local). */
export function assertProviderAuthIfNeeded() {
  const key = process.env.OPENAI_API_KEY?.trim();
  const base = (process.env.OPENAI_BASE_URL || "").toLowerCase();
  const isOllama =
    base.includes("localhost") ||
    base.includes("127.0.0.1") ||
    base.includes("ollama");
  if (!key && !isOllama) {
    required("OPENAI_API_KEY");
  }
}
