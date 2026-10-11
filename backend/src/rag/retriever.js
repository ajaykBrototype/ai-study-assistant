import { createEmbedding } from "./embeddings.js";
import { getVectorStore } from "./vectorStore.js";

function cosineSimilarity(vectorA, vectorB) {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] ** 2;
        magnitudeB += vectorB[i] ** 2;
    }

    return dotProduct / (
        Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB)
    );
}

export async function retrieveRelevantChunks(
    query,
    topK = 3,
    minScore = 0.5
) {
    const queryEmbedding = await createEmbedding(query);

    const vectorStore = getVectorStore();

    const results = vectorStore
        .map((item) => ({
            ...item,
            score: cosineSimilarity(
                queryEmbedding,
                item.embedding
            )
        }))
        .filter((item) => item.score >= minScore);

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK);
}