import { NextResponse } from "next/server";
import { completeChat } from "@/lib/llm";
import type { ChatMessage } from "@/lib/types";

export const runtime = "nodejs";

function isChatMessage(x: unknown): x is ChatMessage {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    (m.role === "user" || m.role === "assistant" || m.role === "system") &&
    typeof m.content === "string"
  );
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

  const { messages } = body as {
    messages?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 },
    );
  }

  if (!messages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "Each message must have role user|assistant|system and string content." },
      { status: 400 },
    );
  }

  try {
    const result = await completeChat(messages as ChatMessage[]);
    return NextResponse.json({ reply: result.reply });
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
