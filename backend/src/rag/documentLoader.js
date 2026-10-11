import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const documentsPath = path.join(__dirname, "documents");

export async function loadDocuments() {
    const files = await fs.readdir(documentsPath);

    const documents = [];

    for (const file of files) {
        if (!file.endsWith(".txt")) continue;

        const filePath = path.join(documentsPath, file);

        const content = await fs.readFile(filePath, "utf-8");

        documents.push({
            content,
            metadata: {
                source: file
            }
        });
    }

    return documents;
}