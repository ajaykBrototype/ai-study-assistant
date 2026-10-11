import { loadDocuments } from "./documentLoader.js";
import { splitDocuments } from "./textSplitter.js";
import { createEmbedding } from "./embeddings.js";

let vectorStore = [];

export async function createVectorStore() {
    const documents = await loadDocuments();

    const chunks = await splitDocuments(documents);

    vectorStore = [];

    for (const chunk of chunks) {
        const embedding = await createEmbedding(chunk.pageContent);

        vectorStore.push({
            content: chunk.pageContent,
            metadata: chunk.metadata,
            embedding
        });
    }

    console.log(`Vector store created with ${vectorStore.length} chunks`);

    return vectorStore;
}

export function getVectorStore() {
    return vectorStore;
}