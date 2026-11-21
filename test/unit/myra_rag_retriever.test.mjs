import test from "node:test";
import assert from "node:assert/strict";
import { MyraRagRetriever } from "../../src/lib/ai/myra-rag.ts";

test("MyraRagRetriever loads chunks from rag/index/chunks.jsonl and searches relevant keywords", () => {
  const chunks = MyraRagRetriever.loadChunks();
  assert(chunks.length > 0, "Chunks index must contain records");

  const results = MyraRagRetriever.search("How do I create a study plan?", 4);
  assert(results.length > 0, "Search must return matching chunks");

  const top = results[0];
  assert(top.title || top.source, "Top result must have title or source");

  const promptBlock = MyraRagRetriever.formatRagPromptBlock("How do I create a study plan?");
  assert(promptBlock.includes("<KNOWLEDGE_BASE_CONTEXT>"), "Prompt block must include knowledge context tag");
  assert(promptBlock.includes("KNOWLEDGE RULES"), "Prompt block must include knowledge rules");
});
