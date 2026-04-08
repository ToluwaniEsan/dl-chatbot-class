import type { ChatMessage } from "@/lib/types";

/** Plain text for RAG query / logging (images omitted). */
export function userMessagePlainText(m: ChatMessage): string {
  if (typeof m.content === "string") return m.content.trim();
  return m.content
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "image_url") return "[image]";
      return "";
    })
    .join("\n")
    .trim();
}
