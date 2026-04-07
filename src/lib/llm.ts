import OpenAI from "openai";
import type { ChatMessage } from "@/lib/types";
import {
  assertProviderAuthIfNeeded,
  getEmbeddingConfig,
  getLlmConfig,
  getSystemPrompt,
} from "@/lib/env";
import {
  loadCorpusChunks,
  topKBySimilarity,
  type IndexedChunk,
} from "@/lib/rag";

function makeClient(apiKey: string, baseURL: string) {
  return new OpenAI({ apiKey, baseURL });
}

async function embedBatch(
  client: OpenAI,
  model: string,
  inputs: string[],
): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const res = await client.embeddings.create({ model, input: inputs });
  const data = [...res.data].sort((a, b) => a.index - b.index);
  return data.map((d) => d.embedding as number[]);
}

function buildRagSystemPrompt(
  base: string,
  retrieved: IndexedChunk[],
): string {
  const blocks = retrieved
    .map(
      (c, i) =>
        `### Source ${i + 1} (${c.source})\n${c.text}`,
    )
    .join("\n\n");
  return `${base}

Use ONLY the following retrieved excerpts when they are relevant. If the answer is not in the excerpts, say you do not have that information in the provided materials.

## Retrieved context
${blocks}`;
}

export async function completeChat(
  messages: ChatMessage[],
  options: { useRag: boolean },
): Promise<{ reply: string; sources?: string[] }> {
  assertProviderAuthIfNeeded();
  const llm = getLlmConfig();
  const embedding = getEmbeddingConfig();
  const client = makeClient(llm.apiKey, llm.baseURL);

  const systemBase = getSystemPrompt();
  let systemContent = systemBase;
  let sources: string[] | undefined;

  if (options.useRag) {
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
    const query = lastUser?.content?.trim() || "";
    if (chunks.length > 0 && query) {
      const texts = chunks.map((c) => c.text);
      const [[qVec], docVecs] = await Promise.all([
        embedBatch(client, embedding.model, [query]),
        embedBatch(client, embedding.model, texts),
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
    }
  }

  const history = messages.filter((m) => m.role !== "system");
  const apiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const completion = await client.chat.completions.create({
    model: llm.model,
    messages: apiMessages,
    temperature: llm.temperature,
    max_tokens: llm.maxTokens,
  });

  const reply = completion.choices[0]?.message?.content?.trim() ?? "";
  if (!reply) {
    throw new Error("Empty response from the language model.");
  }
  return { reply, sources };
}
