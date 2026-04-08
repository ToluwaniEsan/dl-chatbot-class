import { NextResponse } from "next/server";
import { completeChat } from "@/lib/llm";
import { normalizeChatMessages } from "@/lib/messageNormalize";
import type { ChatMessage, MessageContentPart } from "@/lib/types";

export const runtime = "nodejs";

function isTextPart(x: unknown): x is { type: "text"; text: string } {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.type === "text" && typeof o.text === "string";
}

function isImagePart(
  x: unknown,
): x is { type: "image_url"; image_url: { url: string } } {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.type !== "image_url" || !o.image_url || typeof o.image_url !== "object")
    return false;
  const u = (o.image_url as Record<string, unknown>).url;
  return typeof u === "string" && u.length > 0;
}

function isFilePart(
  x: unknown,
): x is {
  type: "file";
  filename: string;
  media_type: string;
  data: string;
} {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    o.type === "file" &&
    typeof o.filename === "string" &&
    typeof o.media_type === "string" &&
    typeof o.data === "string"
  );
}

function isContentPart(x: unknown): x is MessageContentPart {
  return isTextPart(x) || isImagePart(x) || isFilePart(x);
}

function isChatMessage(x: unknown): x is ChatMessage {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  if (m.role !== "user" && m.role !== "assistant" && m.role !== "system") {
    return false;
  }
  if (m.role === "assistant" || m.role === "system") {
    return typeof m.content === "string";
  }
  if (typeof m.content === "string") return true;
  if (!Array.isArray(m.content)) return false;
  return m.content.every(isContentPart);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object." }, { status: 400 });
  }

<<<<<<< HEAD
  const { messages } = body as { messages?: unknown };
=======
  const { messages } = body as {
    messages?: unknown;
  };
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 },
    );
  }

  if (!messages.every(isChatMessage)) {
    return NextResponse.json(
      {
        error:
          "Invalid messages: use string content or parts (text, image_url, file).",
      },
      { status: 400 },
    );
  }

<<<<<<< HEAD
  let normalized: ChatMessage[];
  try {
    normalized = await normalizeChatMessages(messages as ChatMessage[]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload processing failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await completeChat(normalized, {
      useRag: true,
    });
    return NextResponse.json({
      reply: result.reply,
      ...(result.sources?.length ? { sources: result.sources } : {}),
    });
=======
  try {
    const result = await completeChat(messages as ChatMessage[]);
    return NextResponse.json({ reply: result.reply });
>>>>>>> 506cc67 (Refactor chatbot flow, integrate Tavily search, and polish UI)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status =
      message.includes("Missing environment variable") ||
      message.includes("LLM_API_KEY")
        ? 503
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
