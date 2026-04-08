import LlmClient from "openai";
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

function shouldUseWebSearch(query: string): boolean {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return false;

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
  const client = makeClient(llm.apiKey, llm.baseURL);

  const systemBase = getSystemPrompt();
  let systemContent = systemBase;

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const query = lastUser?.content?.trim() || "";
  const useSearch = Boolean(process.env.TAVILY_API_KEY?.trim());

  if (useSearch && query && shouldUseWebSearch(query)) {
    const searchResult = await searchWeb(query);
    if (searchResult && searchResult.searchResults.length > 0) {
      systemContent = buildSearchContextPrompt(systemBase, searchResult);
    }
  }

  const history = messages.filter((m) => m.role !== "system");
  const apiMessages: LlmClient.Chat.ChatCompletionMessageParam[] = [
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
  return { reply };
}
