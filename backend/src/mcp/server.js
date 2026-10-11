import "dotenv/config";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchNotes } from "./tools/searchNotes.js";
import { quizFromNotes } from "./tools/quizFromNotes.js";
const server = new McpServer({
    name: "ai-study-assistant",
    version: "1.0.0"
});

server.registerTool(
    "search_notes",
    {
        description: "Search the student's study notes using semantic search.",

        inputSchema: {
            query: z
                .string()
                .describe("The study question or topic to search for")
        }
    },

    async ({ query }) => {
        const results = await searchNotes(query);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }
);

server.registerTool(
    "quiz_from_notes",
    {
        description: "Retrieve study notes for creating a quiz about a topic.",

        inputSchema: {
            topic: z
                .string()
                .describe("The study topic for the quiz")
        }
    },

    async ({ topic }) => {
        const results = await quizFromNotes(topic);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(results, null, 2)
                }
            ]
        };
    }
);

const transport = new StdioServerTransport();

await server.connect(transport);