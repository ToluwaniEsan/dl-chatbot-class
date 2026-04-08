"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, MessageContentPart } from "@/lib/types";

type Pending = { id: string; file: File };

function isImageFile(f: File) {
  return f.type.startsWith("image/");
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

/** Base64 without data URL prefix (for PDF / text wire format). */
async function readAsBase64Body(file: File): Promise<string> {
  const dataUrl = await readAsDataUrl(file);
  const i = dataUrl.indexOf(",");
  return i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
}

async function buildUserContent(
  text: string,
  pending: Pending[],
): Promise<string | MessageContentPart[]> {
  const parts: MessageContentPart[] = [];
  for (const { file } of pending) {
    if (isImageFile(file)) {
      const url = await readAsDataUrl(file);
      parts.push({ type: "image_url", image_url: { url } });
    } else {
      parts.push({
        type: "file",
        filename: file.name,
        media_type: file.type || "application/octet-stream",
        data: await readAsBase64Body(file),
      });
    }
  }
  const t = text.trim();
  if (t) {
    parts.push({ type: "text", text: t });
  } else if (parts.length > 0) {
    parts.push({
      type: "text",
      text: "Please describe the image(s) and summarize any uploaded documents.",
    });
  }
  if (parts.length === 1 && parts[0].type === "text") {
    return parts[0].text;
  }
  return parts;
}

function UserBubble({
  content,
}: {
  content: string | MessageContentPart[];
}) {
  if (typeof content === "string") {
    return <div className="whitespace-pre-wrap text-[15px] leading-relaxed">{content}</div>;
  }
  return (
    <div className="space-y-2">
      {content.map((p, i) => {
        if (p.type === "text") {
          return (
            <p key={i} className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {p.text}
            </p>
          );
        }
        if (p.type === "image_url") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={p.image_url.url}
              alt=""
              className="max-h-56 max-w-full rounded-lg border border-white/25 object-contain"
            />
          );
        }
        if (p.type === "file") {
          return (
            <p key={i} className="text-xs opacity-90">
              Attachment: {p.filename}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next: Pending[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      next.push({ id: crypto.randomUUID(), file });
    }
    setPending((p) => [...p, ...next]);
    e.target.value = "";
  };

  const removePending = (id: string) => {
    setPending((p) => p.filter((x) => x.id !== id));
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if ((!text && pending.length === 0) || loading) return;
    setError(null);
    const savedInput = input;
    setInput("");
    const prior = messages;
    const pendingSnapshot = [...pending];
    let userContent: string | MessageContentPart[];
    try {
      userContent = await buildUserContent(text, pendingSnapshot);
    } catch {
      setError("Could not read one of the files.");
      setInput(savedInput);
      return;
    }
    setPending([]);
    const nextMessages: ChatMessage[] = [
      ...prior,
      { role: "user", content: userContent },
    ];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await res.json()) as {
        reply?: string;
        sources?: string[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      if (!data.reply) {
        throw new Error("No reply in response.");
      }
      const assistant: ChatMessage = {
        role: "assistant",
        content: data.reply,
        ...(data.sources?.length ? { sources: data.sources } : {}),
      };
      setMessages([...nextMessages, assistant]);
      setTimeout(scrollToBottom, 50);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
      setMessages(prior);
      setInput(savedInput);
      setPending(pendingSnapshot);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, pending, scrollToBottom]);

  const canSend =
    (input.trim().length > 0 || pending.length > 0) && !loading;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--black)]">
      <header className="shrink-0 border-b border-[var(--border)] bg-[var(--maroon-deep)] px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 rounded-lg bg-[var(--maroon)] ring-2 ring-[var(--accent-ring)]/40"
            aria-hidden
          />
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--cream)]">
              Chat
            </h1>
            <p className="text-xs text-[var(--cream-muted)]/90">Direct messages</p>
          </div>
        </div>
      </header>

      <div className="chat-scroll mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <p className="text-sm text-[var(--cream-muted)]">
              Start a conversation. Attach images or documents (PDF, text, Markdown)
              with the paperclip, then send your prompt.
            </p>
          </div>
        )}
        <div className="mt-auto flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[min(85%,28rem)] rounded-2xl rounded-br-md bg-[var(--user-bubble)] px-4 py-3 text-[var(--cream)] shadow-lg"
                    : "max-w-[min(85%,28rem)] rounded-2xl rounded-bl-md border border-[var(--cream-muted)]/35 bg-[var(--assistant-bubble)] px-4 py-3 text-[var(--ink)] shadow-md"
                }
              >
                {m.role === "user" ? (
                  <UserBubble content={m.content} />
                ) : (
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {typeof m.content === "string" ? m.content : ""}
                  </div>
                )}
                {m.role === "assistant" && m.sources?.length ? (
                  <p className="mt-2 border-t border-[var(--border)]/30 pt-2 text-xs text-[var(--ink)]/60">
                    Sources: {m.sources.join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p
          className="mx-auto w-full max-w-3xl px-3 pb-1 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--black-soft)] px-3 py-3">
        <form
          className="mx-auto flex max-w-3xl flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          {pending.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pending.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="group flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--maroon)]/25 px-3 py-1 text-left text-xs text-[var(--cream)] transition hover:bg-[var(--maroon)]/40"
                >
                  <span className="truncate max-w-[200px]">
                    {isImageFile(p.file) ? "Image" : "File"}: {p.file.name}
                  </span>
                  <span className="text-[var(--cream-muted)] group-hover:text-white" aria-hidden>
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown"
              onChange={onPickFiles}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--maroon)]/40 text-[var(--cream)] transition hover:bg-[var(--maroon)]/60 disabled:opacity-40"
              aria-label="Attach images or documents"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <textarea
              className="min-h-[44px] max-h-36 flex-1 resize-y rounded-xl border border-[var(--border)] bg-[var(--cream)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--ink)]/40 outline-none focus:border-[var(--accent-ring)] focus:ring-1 focus:ring-[var(--accent-ring)]"
              placeholder="Message…"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) void send();
                }
              }}
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="h-11 shrink-0 rounded-xl bg-[var(--maroon)] px-5 text-sm font-medium text-[var(--cream)] shadow transition hover:bg-[var(--user-bubble)] disabled:opacity-40"
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
