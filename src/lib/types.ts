export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  /** Present on assistant turns when RAG cited corpus files */
  sources?: string[];
};
