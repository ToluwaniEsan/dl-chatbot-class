<<<<<<< HEAD
import OpenAI from "openai";
import { userMessagePlainText } from "@/lib/contentText";
=======
import LlmClient from "openai";
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)
import type { ChatMessage } from "@/lib/types";
import {
  assertProviderAuthIfNeeded,
  getLlmConfig,
  getSystemPrompt,
} from "@/lib/env";
import { searchWeb, buildSearchContextPrompt } from "@/lib/tavily";

function makeClient(apiKey: string, baseURL: string) {
  return new LlmClient({ apiKey, baseURL });
}

<<<<<<< HEAD
function apiStatus(e: unknown): number | undefined {
  return (e as { status?: number }).status;
}

/** OpenAI-compatible providers may return multipart or empty string content. */
function normalizeMessageContent(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    const parts = content.map((p) => {
      if (typeof p === "object" && p && "text" in p) {
        return String((p as { text?: string }).text ?? "");
      }
      return "";
    });
    return parts.join("").trim();
  }
  return String(content).trim();
}

/**
 * Final visible reply. Reasoning / “thinking” models may use separate fields
 * (`reasoning_content`, `thinking`) when `content` is empty or output was truncated.
 */
function assistantVisibleText(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const m = message as {
    content?: unknown;
    refusal?: unknown;
    reasoning_content?: unknown;
    thinking?: unknown;
  };
  const fromContent = normalizeMessageContent(m.content);
  if (fromContent) return fromContent;
  if (typeof m.refusal === "string" && m.refusal.trim()) {
    return m.refusal.trim();
  }
  if (typeof m.reasoning_content === "string" && m.reasoning_content.trim()) {
    return m.reasoning_content.trim();
  }
  if (typeof m.thinking === "string" && m.thinking.trim()) {
    return m.thinking.trim();
  }
  return "";
}

function isHighBudgetChatModel(model: string): boolean {
  const l = model.toLowerCase();
  return (
    l.includes("reasoner") ||
    l.includes("deepseek-r1") ||
    /\br1\b/.test(l) ||
    l.includes("qwen3") ||
    l.includes("gpt-oss")
  );
}

function isLocalOllamaBase(baseURL: string): boolean {
  const b = baseURL.toLowerCase();
  return b.includes("localhost") || b.includes("127.0.0.1");
}

function explainApiFailure(e: unknown, kind: "chat" | "embeddings"): never {
  const status = apiStatus(e);
  if (status === 402) {
    throw new Error(
      "402 Insufficient Balance — the API account you are calling has no usable credits. " +
        "Top up or enable billing on that provider's dashboard. " +
        "Alternatively use Ollama locally: set OPENAI_BASE_URL=http://localhost:11434/v1, " +
        "OPENAI_API_KEY=ollama, and a local model id (and for RAG, point OPENAI_EMBEDDING_* at the same Ollama URL with an embedding model).",
    );
  }
  if (status === 404 && kind === "embeddings") {
    throw new Error(
      "Embeddings returned 404 — this API base URL likely has no /embeddings (e.g. DeepSeek). " +
        "Set OPENAI_EMBEDDING_BASE_URL and OPENAI_EMBEDDING_API_KEY to Ollama " +
        "(http://localhost:11434/v1) or another provider that supports embeddings, " +
        "or remove files from data/corpus so RAG skips retrieval.",
    );
  }
  throw e;
}

async function embedBatch(
  client: OpenAI,
  model: string,
  inputs: string[],
): Promise<number[][]> {
  if (inputs.length === 0) return [];
  try {
    const res = await client.embeddings.create({ model, input: inputs });
    const data = [...res.data].sort((a, b) => a.index - b.index);
    return data.map((d) => d.embedding as number[]);
  } catch (e) {
    explainApiFailure(e, "embeddings");
  }
}
=======
function shouldUseWebSearch(query: string): boolean {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return false;
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)

  const shortGreetings = [
    "hi",
    "hello",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "thanks",
    "thank you",
  ];
  if (shortGreetings.includes(normalized)) return false;

  const wordCount = normalized.split(/\s+/).length;
  const questionWords = /\b(what|when|where|why|who|which|how|latest|news|today|current|recent|price|weather|update|updates)\b/;

  return query.includes("?") || questionWords.test(normalized) || wordCount >= 4;
}

export async function completeChat(
  messages: ChatMessage[],
): Promise<{ reply: string }> {
  assertProviderAuthIfNeeded();
  const llm = getLlmConfig();
<<<<<<< HEAD
  const embedding = getEmbeddingConfig();
  const chatClient = makeClient(llm.apiKey, llm.baseURL);
  const embedClient = makeClient(embedding.apiKey, embedding.baseURL);
=======
  const client = makeClient(llm.apiKey, llm.baseURL);
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)

  const systemBase = getSystemPrompt();
  let systemContent = systemBase;

<<<<<<< HEAD
  const ragEnabledEnv = process.env.RAG_ENABLED?.trim().toLowerCase();
  const ragEnabled =
    ragEnabledEnv !== "false" && ragEnabledEnv !== "0" && ragEnabledEnv !== "off";

  if (options.useRag && ragEnabled) {
    const corpusDir = process.env.RAG_CORPUS_DIR?.trim() || "data/corpus";
    const maxChunk = Number(process.env.RAG_CHUNK_CHARS ?? "900");
    const overlap = Number(process.env.RAG_CHUNK_OVERLAP ?? "120");
    const topK = Number(process.env.RAG_TOP_K ?? "4");
    const chunks = await loadCorpusChunks(
      corpusDir,
      Number.isFinite(maxChunk) ? maxChunk : 900,
      Number.isFinite(overlap) ? overlap : 120,
    );
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const query = lastUser ? userMessagePlainText(lastUser) : "";
    if (chunks.length > 0 && query) {
      const texts = chunks.map((c) => c.text);
      const [[qVec], docVecs] = await Promise.all([
        embedBatch(embedClient, embedding.model, [query]),
        embedBatch(embedClient, embedding.model, texts),
      ]);
      const picked = topKBySimilarity(
        qVec,
        chunks,
        docVecs,
        Number.isFinite(topK) ? topK : 4,
      );
      if (picked.length > 0) {
        systemContent = buildRagSystemPrompt(systemBase, picked);
        sources = [...new Set(picked.map((p) => p.source))];
      }
=======
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content?.trim() || "";
  const useSearch = Boolean(process.env.TAVILY_API_KEY?.trim());

  // Try web search first only for likely factual/current queries.
  if (useSearch && query && shouldUseWebSearch(query)) {
    const searchResult = await searchWeb(query);
    if (searchResult && searchResult.searchResults.length > 0) {
      systemContent = buildSearchContextPrompt(systemBase, searchResult);
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)
    }
  }

  const history = messages.filter((m) => m.role !== "system");
  const apiMessages: LlmClient.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((m): OpenAI.Chat.ChatCompletionMessageParam => {
      if (m.role === "assistant") {
        const c =
          typeof m.content === "string" ? m.content : normalizeMessageContent(m.content);
        return { role: "assistant", content: c };
      }
      if (typeof m.content === "string") {
        return { role: m.role, content: m.content };
      }
      return {
        role: "user",
        content: m.content as OpenAI.Chat.ChatCompletionContentPart[],
      };
    }),
  ];

  // Reasoning / thinking models share max_tokens between internal trace and final answer.
  const modelLower = llm.model.toLowerCase();
  const minReasoningOut = 16384;
  const maxOutCap = 65536;
  const wantsHighBudget = isHighBudgetChatModel(llm.model);
  let maxTokens = wantsHighBudget
    ? Math.max(llm.maxTokens, minReasoningOut)
    : llm.maxTokens;

  /** Ollama extension; keeps Qwen3-style models from filling the whole budget with `thinking` only. */
  const thinkPref =
    process.env.LLM_THINK?.trim().toLowerCase() === "true"
      ? true
      : process.env.LLM_THINK?.trim().toLowerCase() === "false"
        ? false
        : undefined;

  const createBody = (
    maxTok: number,
  ): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & { think?: boolean } => {
    const body: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming & {
      think?: boolean;
    } = {
      model: llm.model,
      messages: apiMessages,
      temperature: llm.temperature,
      max_tokens: maxTok,
    };
    if (
      thinkPref === false ||
      (thinkPref === undefined &&
        isLocalOllamaBase(llm.baseURL) &&
        modelLower.includes("qwen3"))
    ) {
      body.think = false;
    } else if (thinkPref === true) {
      body.think = true;
    }
    return body;
  };

  let completion: OpenAI.Chat.ChatCompletion;
  try {
    completion = await chatClient.chat.completions.create(createBody(maxTokens));
  } catch (e) {
    explainApiFailure(e, "chat");
  }

  let choice = completion.choices[0];
  let reply = assistantVisibleText(choice?.message);

  if (!reply && choice?.finish_reason === "length") {
    const bumped = Math.min(
      Math.max(maxTokens * 2, minReasoningOut),
      maxOutCap,
    );
    if (bumped > maxTokens) {
      maxTokens = bumped;
      try {
        completion = await chatClient.chat.completions.create(createBody(bumped));
      } catch (e) {
        explainApiFailure(e, "chat");
      }
      choice = completion.choices[0];
      reply = assistantVisibleText(choice?.message);
    }
  }

  if (!reply) {
    const finish = choice?.finish_reason ?? "unknown";
    const hint =
      finish === "length" || wantsHighBudget
        ? " Set LLM_MAX_TOKENS=16384 (or higher) in .env.local. For Ollama + Qwen3, the app sends think=false unless LLM_THINK=true so the answer stays in content."
        : "";
    throw new Error(
      `Empty response from the language model (finish_reason: ${finish}).${hint}`,
    );
  }
  return { reply };
}
