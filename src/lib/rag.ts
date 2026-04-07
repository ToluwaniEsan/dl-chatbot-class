import fs from "node:fs/promises";
import path from "node:path";

export type IndexedChunk = {
  id: string;
  text: string;
  source: string;
};

function chunkText(text: string, maxChars: number, overlap: number): string[] {
  const t = text.replace(/\r\n/g, "\n").trim();
  if (!t) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < t.length) {
    const end = Math.min(t.length, i + maxChars);
    chunks.push(t.slice(i, end).trim());
    if (end >= t.length) break;
    i = Math.max(end - overlap, i + 1);
  }
  return chunks.filter(Boolean);
}

export async function loadCorpusChunks(
  corpusDir: string,
  maxChunkChars: number,
  overlapChars: number,
): Promise<IndexedChunk[]> {
  const abs = path.isAbsolute(corpusDir)
    ? corpusDir
    : path.join(process.cwd(), corpusDir);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(abs);
  } catch {
    return [];
  }
  const out: IndexedChunk[] = [];
  for (const name of entries) {
    if (!/\.(md|txt)$/i.test(name)) continue;
    const fp = path.join(abs, name);
    const raw = await fs.readFile(fp, "utf8");
    const parts = chunkText(raw, maxChunkChars, overlapChars);
    parts.forEach((text, idx) => {
      out.push({ id: `${name}#${idx}`, text, source: name });
    });
  }
  return out;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export function topKBySimilarity(
  queryVec: number[],
  chunks: IndexedChunk[],
  vectors: number[][],
  k: number,
): IndexedChunk[] {
  const scored = chunks.map((c, i) => ({
    c,
    s: cosineSimilarity(queryVec, vectors[i] ?? []),
  }));
  scored.sort((x, y) => y.s - x.s);
  return scored.slice(0, k).map((x) => x.c);
}
