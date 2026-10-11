import "dotenv/config";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({
    name: "study-assistant-client",
    version: "1.0.0"
});

const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp/server.js"]
});

await client.connect(transport);

console.log("Connected to MCP server");

const tools = await client.listTools();

console.log("Available tools:");
console.log(tools.tools);

const result = await client.callTool({
    name: "quiz_from_notes",
    arguments: {
        topic: "JavaScript closures"
    }
});

console.log("\nQuiz notes:");
console.log(result);

await client.close();