"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [useRag, setUseRag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    const prior = messages;
    const nextMessages: ChatMessage[] = [
      ...prior,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          useRag,
        }),
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
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, scrollToBottom, useRag]);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
      <header className="mb-6 border-b border-[var(--border)] pb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Class chatbot
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Pretrained LLM via OpenAI-compatible API (see{" "}
          <code className="rounded bg-[var(--card)] px-1">.env.example</code>
          ).
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useRag}
            onChange={(e) => setUseRag(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          <span>Use RAG (retrieve from {`data/corpus`})</span>
        </label>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 min-h-[320px]">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--muted)]">
            Send a message to start. Add <code className="rounded bg-[var(--background)] px-1">.md</code> or{" "}
            <code className="rounded bg-[var(--background)] px-1">.txt</code> files
            under <code className="rounded bg-[var(--background)] px-1">data/corpus</code> for RAG.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
              m.role === "user"
                ? "ml-auto bg-[var(--accent)] text-white"
                : "mr-auto bg-[var(--background)] text-[var(--foreground)]"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.content}</div>
            {m.role === "assistant" && m.sources?.length ? (
              <p className="mt-2 border-t border-[var(--border)] pt-2 text-xs text-[var(--muted)]">
                Sources: {m.sources.join(", ")}
              </p>
            ) : null}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </main>
  );
}
