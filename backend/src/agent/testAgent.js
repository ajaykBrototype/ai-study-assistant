import "dotenv/config";

import { runAgent } from "./agent.js";

const result = await runAgent(
    "What is a JavaScript closure?"
);


console.log("\nFINAL AGENT RESULT:");
console.log(result);