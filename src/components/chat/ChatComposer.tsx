import type { FormEvent } from "react";

type ChatComposerProps = {
  input: string;
  loading: boolean;
  error: string | null;
  onInputChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function ChatComposer({
  input,
  loading,
  error,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  const isDisabled = loading || !input.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <div className="border-t border-[var(--border)] p-3 sm:p-4">
      {error && (
        <p
          className="mb-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <input
          className="w-full flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          placeholder="Ask anything about your course..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSubmit();
            }
          }}
          disabled={loading}
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
