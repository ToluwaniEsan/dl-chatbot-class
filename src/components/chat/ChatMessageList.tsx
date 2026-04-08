import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/types";

type ChatMessageListProps = {
  messages: ChatMessage[];
  loading: boolean;
  onSelectPrompt: (value: string) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function ChatMessageList({
  messages,
  loading,
  onSelectPrompt,
  bottomRef,
}: ChatMessageListProps) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
      {messages.length === 0 && (
        <div className="enter-rise rounded-2xl border border-dashed border-[var(--border)] bg-white/70 p-4 sm:p-5">
          <p className="text-sm text-[var(--muted)]">Try one of these prompts:</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onSelectPrompt("Explain transformers in simple terms")}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-sm transition hover:border-[var(--accent)]"
            >
              Explain transformers in simple terms
            </button>
            <button
              type="button"
              onClick={() => onSelectPrompt("Create 5 quiz questions on deep learning basics")}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left text-sm transition hover:border-[var(--accent)]"
            >
              Create 5 quiz questions on deep learning basics
            </button>
          </div>
        </div>
      )}

      {messages.map((message, index) => (
        <div
          key={`${index}-${message.role}`}
          className={`enter-rise max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[80%] ${
            message.role === "user"
              ? "ml-auto bg-[var(--accent)] text-white"
              : "mr-auto border border-[var(--border)] bg-[var(--assistant)] text-[var(--foreground)]"
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
      ))}

      {loading && (
        <div className="enter-rise mr-auto inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--assistant)] px-3 py-2 text-sm text-[var(--muted)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
          Thinking...
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
