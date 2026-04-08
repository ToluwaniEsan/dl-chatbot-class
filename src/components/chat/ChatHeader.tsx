type ChatHeaderProps = {
  onClear: () => void;
  disableClear: boolean;
};

export function ChatHeader({ onClear, disableClear }: ChatHeaderProps) {
  return (
    <header className="card-shell enter-fade px-5 py-4 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
            Classroom Assistant
          </p>
          <h1
            className="mt-1 text-2xl leading-tight sm:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ask Better, Learn Faster
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-medium text-[var(--muted)]">
            Live
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={disableClear}
            className="rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear chat
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Your Groq-powered study chatbot is ready. Ask for concise summaries, quiz prep, or concept breakdowns.
      </p>
    </header>
  );
}
