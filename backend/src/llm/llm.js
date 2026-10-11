import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});

export async function generateText(prompt) {
    try {
        const response = await client.chat.completions.create({
            model: "openrouter/free",

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],

            temperature: 0.2,
            max_tokens: 1500
        });

        console.log("MODEL:", response.model);
        console.log("PROVIDER:", response.provider);

        console.log(
            "FINISH REASON:",
            response.choices?.[0]?.finish_reason
        );

        console.log(
            "NATIVE FINISH REASON:",
            response.choices?.[0]?.native_finish_reason
        );

        const content = response.choices?.[0]?.message?.content;

        console.log("CONTENT:", content);

        if (!content) {
            throw new Error("LLM returned an empty response");
        }

        return content;

    } catch (error) {

        console.error("LLM ERROR:", error);

        if (error.status === 429) {
            const quotaError = new Error(
                "OpenRouter free-model quota is exhausted."
            );

            quotaError.code = "OPENROUTER_QUOTA_EXHAUSTED";

            throw quotaError;
        }

        throw error;
    }
}


export async function generateAnswer(question, context) {

    const prompt = `
You are an AI Study Assistant.

Answer the student's question using ONLY the study material
provided below.

If the answer cannot be found in the study material, say:

"I couldn't find that information in the study material."

Study Material:
${context}

Student Question:
${question}

Give a clear and concise explanation.
`;

    return generateText(prompt);
}