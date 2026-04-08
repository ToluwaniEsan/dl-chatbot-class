import { PDFParse } from "pdf-parse";
import type { ChatMessage, MessageContentPart } from "@/lib/types";

const MAX_FILE_BYTES = 12 * 1024 * 1024; // 12 MB per file

async function filePartToTextParts(
  part: Extract<MessageContentPart, { type: "file" }>,
): Promise<MessageContentPart[]> {
  const buf = Buffer.from(part.data, "base64");
  if (buf.length > MAX_FILE_BYTES) {
    throw new Error(`File too large: ${part.filename} (max ${MAX_FILE_BYTES / 1024 / 1024} MB).`);
  }
  const mime = part.media_type.toLowerCase();
  const name = part.filename;

  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    const text = result.text?.trim() || "";
    return [
      {
        type: "text",
        text: `[Uploaded PDF: ${name}]\n${text || "(No extractable text.)"}`,
      },
    ];
  }

  if (
    mime.startsWith("text/") ||
    /\.(txt|md|csv|json|xml|html)$/i.test(name)
  ) {
    const text = buf.toString("utf8");
    return [{ type: "text", text: `[Uploaded file: ${name}]\n${text}` }];
  }

  throw new Error(
    `Unsupported file type for ${name} (${mime}). Use PDF, plain text, .md, or .csv.`,
  );
}

async function normalizeParts(
  parts: MessageContentPart[],
): Promise<MessageContentPart[]> {
  const out: MessageContentPart[] = [];
  for (const p of parts) {
    if (p.type === "file") {
      const converted = await filePartToTextParts(p);
      out.push(...converted);
    } else {
      out.push(p);
    }
  }
  return mergeAdjacentTextParts(out);
}

function mergeAdjacentTextParts(parts: MessageContentPart[]): MessageContentPart[] {
  const merged: MessageContentPart[] = [];
  for (const p of parts) {
    if (p.type === "text" && merged.length > 0 && merged[merged.length - 1].type === "text") {
      const prev = merged[merged.length - 1] as { type: "text"; text: string };
      prev.text = `${prev.text}\n\n${p.text}`;
    } else {
      merged.push({ ...p });
    }
  }
  return merged;
}

/**
 * Converts wire `file` parts into text; leaves images and text as-is.
 * Assistant messages should remain string content.
 */
export async function normalizeChatMessages(
  messages: ChatMessage[],
): Promise<ChatMessage[]> {
  const out: ChatMessage[] = [];
  for (const m of messages) {
    if (m.role === "assistant" || typeof m.content === "string") {
      out.push(m);
      continue;
    }
    const hasFile = m.content.some((p) => p.type === "file");
    if (!hasFile) {
      out.push(m);
      continue;
    }
    const parts = await normalizeParts(m.content);
    out.push({ ...m, content: parts });
  }
  return out;
}
