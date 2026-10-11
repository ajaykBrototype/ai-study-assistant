import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { generateText } from "../llm/llm.js";


// ======================================================
// MCP CLIENT
// ======================================================

const client = new Client({
    name: "study-agent",
    version: "1.0.0"
});


const transport = new StdioClientTransport({
    command: "node",
    args: ["src/mcp/server.js"]
});


await client.connect(transport);

console.log("Agent connected to MCP server");


// ======================================================
// SELECT TOOL
// ======================================================

export async function selectTool(userInput) {

    const prompt = `
You are an AI Study Assistant.

Choose exactly one tool based on the user's request.

Available tools:

1. search_notes
   Use this when the user wants to learn, understand,
   explain, or find information from study notes.

2. quiz_from_notes
   Use this when the user wants a quiz, questions,
   test, challenge, or assessment.

User request:
${userInput}

Return ONLY one of these exact tool names:

search_notes
quiz_from_notes
`;

    const response = await generateText(prompt);

    return response.trim();
}


// ======================================================
// DECIDE NEXT ACTION
// ======================================================

export async function decideNextAction(
    userInput,
    toolResult = null
) {

    const prompt = `
You are the decision-making component of an AI Study Assistant.

The assistant must answer study-related questions using
the student's study notes whenever possible.

User request:
${userInput}

Previous tool result:
${toolResult || "No tool has been used yet."}

Available tools:

1. search_notes
   Search the student's study notes for information
   relevant to the user's question.

2. quiz_from_notes
   Create a quiz from the student's study notes.

Decision rules:

1. If no tool has been used yet and the user asks
   a study-related question, use search_notes.

2. If the user asks for a quiz, test, challenge,
   or questions, use quiz_from_notes.

3. If a previous tool result contains enough information
   to answer the user's request, choose final.

4. If the previous tool result does not contain enough
   information, choose another appropriate tool.

5. Do NOT choose final simply because you know the answer
   from general knowledge.

6. The study notes are the source of truth.

Return ONLY valid JSON.

If a tool is needed:

{
  "action": "tool",
  "tool": "search_notes",
  "reason": "short reason"
}

OR

{
  "action": "tool",
  "tool": "quiz_from_notes",
  "reason": "short reason"
}

If the available tool result is sufficient:

{
  "action": "final",
  "reason": "short reason"
}

Do not return markdown.
Do not return explanations outside JSON.
`;

    const response = await generateText(prompt);

    console.log(
        "[AGENT DECISION RAW]:",
        response
    );


    // ==================================================
    // PARSE JSON
    // ==================================================

    let decision;

    try {

        decision = JSON.parse(response);

    } catch (error) {

        throw new Error(
            "Agent returned invalid decision JSON"
        );
    }


    // ==================================================
    // VALIDATE ACTION
    // ==================================================

    if (
        !["tool", "final"].includes(
            decision.action
        )
    ) {

        throw new Error(
            "Invalid agent action"
        );
    }


    // ==================================================
    // VALIDATE TOOL
    // ==================================================

    if (
        decision.action === "tool" &&
        ![
            "search_notes",
            "quiz_from_notes"
        ].includes(decision.tool)
    ) {

        throw new Error(
            "Invalid agent tool"
        );
    }


    return decision;
}


// ======================================================
// RUN AGENT
// ======================================================

export async function runAgent(userInput) {

    let toolResult = null;
    let iterations = 0;

    const activity = [];

    const MAX_ITERATIONS = 3;

    while (iterations < MAX_ITERATIONS) {

        iterations++;

        console.log(
            `\n[AGENT] ===== ITERATION ${iterations} =====`
        );


        // ==================================================
        // IF WE ALREADY HAVE TOOL RESULT
        // GENERATE FINAL ANSWER
        // ==================================================

        if (toolResult) {

            console.log(
                "[AGENT] Tool result available."
            );

            console.log(
                "[AGENT] Generating final answer."
            );


            activity.push({
                type: "decision",
                iteration: iterations,
                action: "final",
                tool: null
            });


            const finalPrompt = `
You are an AI Study Assistant.

User request:
${userInput}

Study material obtained from the tool:
${toolResult}

Answer the user's request using ONLY the
information provided by the tool.

Do not use outside knowledge.

If the study material does not contain enough
information to answer the question, say:

"I couldn't find that information in the study material."

Give a clear and concise answer.
`;


            let finalAnswer;

            try {

                finalAnswer =
                    await generateText(finalPrompt);

            } catch (error) {

                // ==========================================
                // LOCAL FALLBACK
                // ==========================================

                if (
                    error.code ===
                    "OPENROUTER_QUOTA_EXHAUSTED"
                ) {

                    console.log(
                        "[AGENT] OpenRouter quota exhausted."
                    );

                    console.log(
                        "[AGENT] Using local fallback answer."
                    );

                    const { generateLocalAnswer } =
                        await import("./localAnswer.js");

                    finalAnswer =
                        generateLocalAnswer(
                            userInput,
                            toolResult
                        );

                } else {

                    throw error;

                }
            }


            activity.push({
                type: "final",
                iteration: iterations
            });


            return {
                iterations,
                answer: finalAnswer,
                activity
            };
        }


        // ==================================================
        // FIRST ITERATION — DECIDE TOOL
        // ==================================================

        let decision;

        try {

            decision = await decideNextAction(
                userInput,
                toolResult
            );

        } catch (error) {

            // ==========================================
            // LOCAL FALLBACK DECISION
            // ==========================================

            if (
                error.code ===
                "OPENROUTER_QUOTA_EXHAUSTED"
            ) {

                console.log(
                    "[AGENT] OpenRouter unavailable."
                );

                console.log(
                    "[AGENT] Using local decision."
                );

                const {
                    localDecideNextAction
                } = await import("./localDecision.js");

                decision =
                    localDecideNextAction(
                        userInput,
                        toolResult
                    );

            } else {

                throw error;

            }
        }


        console.log(
            "[AGENT] Decision:",
            decision
        );


        // ==================================================
        // ACTIVITY — DECISION
        // ==================================================

        activity.push({

            type: "decision",

            iteration: iterations,

            action: decision.action,

            tool: decision.tool || null

        });


        // ==================================================
        // FINAL DECISION
        // ==================================================

        if (decision.action === "final") {

            console.log(
                "[AGENT] Agent decided to finish."
            );

            continue;
        }


        // ==================================================
        // TOOL DECISION
        // ==================================================

        if (decision.action === "tool") {

            console.log(
                "[AGENT] Executing tool:",
                decision.tool
            );


            activity.push({

                type: "tool",

                iteration: iterations,

                tool: decision.tool

            });


            // ==============================================
            // TOOL ARGUMENTS
            // ==============================================

            let argumentsObject;


            if (decision.tool === "search_notes") {

                argumentsObject = {
                    query: userInput
                };

            } else if (
                decision.tool === "quiz_from_notes"
            ) {

                argumentsObject = {
                    topic: userInput
                };

            }


            // ==============================================
            // CALL MCP TOOL
            // ==============================================

            const result =
                await client.callTool({

                    name: decision.tool,

                    arguments: argumentsObject

                });


            // ==============================================
            // MCP ERROR
            // ==============================================

            if (result.isError) {

                throw new Error(

                    result.content?.[0]?.text ||
                    "MCP tool execution failed"

                );

            }


            // ==============================================
            // GET TOOL RESULT
            // ==============================================

            toolResult = result.content?.[0]?.text;

console.log("\n[AGENT] TOOL RESULT:");
console.log(toolResult);

if (!toolResult) {
    throw new Error("MCP tool returned empty result");
}


            if (!toolResult) {

                throw new Error(
                    "MCP tool returned empty result"
                );

            }


            // ==============================================
            // RAG ACTIVITY
            // ==============================================

            try {

                const parsedResult =
                    JSON.parse(toolResult);


                if (
                    Array.isArray(parsedResult)
                ) {

                    for (
                        const item of parsedResult
                    ) {

                        activity.push({

                            type: "retrieval",

                            iteration: iterations,

                            source: item.source,

                            score: item.score

                        });

                    }

                } else if (
                    parsedResult.sources
                ) {

                    for (
                        const source
                        of parsedResult.sources
                    ) {

                        activity.push({

                            type: "retrieval",

                            iteration: iterations,

                            source: source.source,

                            score: source.score

                        });

                    }

                }

            } catch (error) {

                console.log(
                    "[AGENT] Could not parse tool result for activity"
                );

            }


            console.log(
                "[AGENT] Tool result received."
            );
        }
    }


    throw new Error(
        "Agent reached maximum iterations"
    );
}