"use client";

import { useCallback, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessageList } from "@/components/chat/ChatMessageList";
import type { ChatMessage } from "@/lib/types";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const clearChat = useCallback(() => {
    if (loading) return;
    setMessages([]);
    setError(null);
  }, [loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    const prior = messages;
    const nextMessages: ChatMessage[] = [...prior, { role: "user", content: text }];
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
  }, [input, loading, messages, scrollToBottom]);

  return (
    <main className="grain-bg min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-4 sm:gap-5">
        <ChatHeader onClear={clearChat} disableClear={loading || messages.length === 0} />

        <div className="card-shell flex min-h-[56vh] flex-col overflow-hidden">
          <ChatMessageList
            messages={messages}
            loading={loading}
            onSelectPrompt={setInput}
            bottomRef={bottomRef}
          />
          <ChatComposer
            input={input}
            loading={loading}
            error={error}
            onInputChange={setInput}
            onSubmit={send}
          />
        </div>
      </section>
    </main>
  );
}
