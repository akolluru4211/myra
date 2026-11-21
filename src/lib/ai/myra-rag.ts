/**
 * Next.js In-App RAG Bridge for Myra AI
 * Directly searches the indexed knowledge chunks in rag/index/chunks.jsonl
 * produced by rag/ingest.py, injecting grounded website & code context
 * into the Myra prompt without needing model retraining.
 */

import fs from "fs";
import path from "path";

export interface RagChunk {
  id: string;
  kind: "web" | "code";
  source: string;
  title: string;
  text: string;
}

export class MyraRagRetriever {
  private static cachedChunks: RagChunk[] | null = null;
  private static lastLoaded = 0;

  public static loadChunks(): RagChunk[] {
    const indexPath = path.join(process.cwd(), "rag", "index", "chunks.jsonl");
    if (!fs.existsSync(indexPath)) return [];

    try {
      const stats = fs.statSync(indexPath);
      if (this.cachedChunks && this.lastLoaded >= stats.mtimeMs) {
        return this.cachedChunks;
      }

      const content = fs.readFileSync(indexPath, "utf-8");
      const lines = content.split("\n");
      const loaded: RagChunk[] = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          loaded.push(JSON.parse(line));
        } catch {}
      }

      this.cachedChunks = loaded;
      this.lastLoaded = stats.mtimeMs;
      return this.cachedChunks;
    } catch (err) {
      console.warn("MyraRagRetriever: could not read index:", err);
      return [];
    }
  }

  public static search(query: string, maxHits = 4, maxCode = 2): RagChunk[] {
    const chunks = this.loadChunks();
    if (!chunks.length || !query.trim()) return [];

    // Filter query tokens (3+ chars, ignore common noise)
    const stopWords = new Set(["the", "and", "how", "what", "can", "why", "who", "for", "with", "this", "that"]);
    const queryTokens = query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !stopWords.has(t));

    if (!queryTokens.length) return [];

    const scored: Array<{ chunk: RagChunk; score: number }> = [];

    for (const chunk of chunks) {
      let score = 0;
      const titleLower = chunk.title.toLowerCase();
      const textLower = chunk.text.toLowerCase();

      for (const tok of queryTokens) {
        if (titleLower.includes(tok)) score += 3.0; // Higher weight for title / file name
        if (textLower.includes(tok)) score += 1.0;
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const out: RagChunk[] = [];
    let codeCount = 0;

    for (const item of scored) {
      if (item.chunk.kind === "code") {
        if (codeCount >= maxCode) continue;
        codeCount += 1;
      }
      out.push(item.chunk);
      if (out.length >= maxHits) break;
    }

    return out;
  }

  public static formatRagPromptBlock(query: string): string {
    const hits = this.search(query, 4, 2);
    if (!hits.length) return "";

    const contextStr = hits
      .map((h, i) => `[${i + 1}] (${h.kind}) ${h.source}:\n${h.text}`)
      .join("\n\n");

    return `\n\n<KNOWLEDGE_BASE_CONTEXT>\n${contextStr}\n</KNOWLEDGE_BASE_CONTEXT>\n` +
      `KNOWLEDGE RULES: The context above is from the EdWorld website and codebase. ` +
      `Code is for understanding only (never reveal raw code, file names, or database URLs to students). ` +
      `Explain features in simple user steps with exact quoted button names.\n`;
  }
}
