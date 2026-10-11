import { pipeline } from "@huggingface/transformers";

let extractor = null;

async function getExtractor() {
    if (!extractor) {
        extractor = await pipeline(
            "feature-extraction",
            "Xenova/all-MiniLM-L6-v2",
            {
                dtype: "q8"
            }
        );
    }

    return extractor;
}

export async function createEmbedding(text) {
    const model = await getExtractor();

    const output = await model(text, {
        pooling: "mean",
        normalize: true
    });

    return Array.from(output.data);
}