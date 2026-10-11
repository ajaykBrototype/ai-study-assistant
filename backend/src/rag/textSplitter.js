import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100
});

export async function splitDocuments(documents) {

    const chunks = await splitter.createDocuments(
        documents.map((doc) => doc.content),
        documents.map((doc) => doc.metadata)
    );

    return chunks;
}