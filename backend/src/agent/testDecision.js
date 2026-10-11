import "dotenv/config";

import { decideNextAction } from "./agent.js";

const decision = await decideNextAction(
    "What is a JavaScript closure?"
);

console.log("\nFINAL DECISION:");
console.log(decision);