export type ChatRole = "system" | "user" | "assistant";

/** OpenAI-compatible multimodal parts + wire-only file payloads (normalized server-side). */
export type MessageContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | {
      type: "file";
      filename: string;
      media_type: string;
      /** Base64 of raw file bytes */
      data: string;
    };

export type ChatMessage = {
  role: ChatRole;
  content: string;
};
