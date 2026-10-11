import { createVectorStore } from "../../rag/vectorStore.js";
import { retrieveRelevantChunks } from "../../rag/retriever.js";

export async function searchNotes(query) {
    console.log("\n[MCP] Search query:", query);

    const vectorStore = await createVectorStore();

    console.log("[MCP] Vector store size:", vectorStore.length);

    const results = await retrieveRelevantChunks(query, 3);

    console.log("[MCP] Retrieved results:", results);

    return results.map((result) => ({
        content: result.content,
        source: result.metadata.source,
        score: result.score
    }));
}