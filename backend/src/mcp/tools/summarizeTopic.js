import { createVectorStore } from "../../rag/vectorStore.js";
import { retrieveRelevantChunks } from "../../rag/retriever.js";
import { generateAnswer } from "../../llm/llm.js";

export async function quizFromNotes(topic) {
    await createVectorStore();

    const results = await retrieveRelevantChunks(topic, 3);

    const context = results
        .map((result) => result.content)
        .join("\n\n");

    const prompt = `
Create a short quiz about the following study material.

Study Material:
${context}

Topic:
${topic}

Create 3 questions.

For each question provide:
1. Question
2. Four options
3. Correct answer

Use ONLY the provided study material.
`;

    const quiz = await generateAnswer(topic, prompt);

    return {
        topic,
        quiz,
        sources: results.map((result) => ({
            source: result.metadata.source,
            score: result.score
        }))
    };
}