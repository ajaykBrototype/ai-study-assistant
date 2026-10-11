import { createVectorStore } from "../../rag/vectorStore.js";
import { retrieveRelevantChunks } from "../../rag/retriever.js";
import { generateText } from "../../llm/llm.js";


// --------------------------------------------------
// CONTENT VALIDATION
// --------------------------------------------------

function normalizeWord(word) {
    return word
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();
}


function wordMatchesContext(word, context) {

    const normalizedWord = normalizeWord(word);

    const contextWords = context
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map(normalizeWord);

    // Exact match
    if (contextWords.includes(normalizedWord)) {
        return true;
    }

    // Simple past tense variation
    if (
        normalizedWord.endsWith("ed") &&
        contextWords.includes(
            normalizedWord.slice(0, -2)
        )
    ) {
        return true;
    }

    // Simple plural variation
    if (
        normalizedWord.endsWith("s") &&
        contextWords.includes(
            normalizedWord.slice(0, -1)
        )
    ) {
        return true;
    }

    // Simple -ing variation
    if (
        normalizedWord.endsWith("ing") &&
        contextWords.includes(
            normalizedWord.slice(0, -3)
        )
    ) {
        return true;
    }

    return false;
}


function validateQuizContent(quiz, context) {

    for (const question of quiz.questions) {

        const correctOption =
            question.options[
                question.correctAnswer
            ];

        const answerWords = correctOption
            .split(/\s+/)
            .map(normalizeWord)
            .filter(word => word.length > 4);

        const supportedWords =
            answerWords.filter(word =>
                wordMatchesContext(word, context)
            );

        console.error(
            "Checking answer:",
            correctOption
        );

        console.error(
            "Supported words:",
            supportedWords
        );

        if (supportedWords.length === 0) {

            console.error(
                "CONTENT VALIDATION FAILED"
            );

            return false;
        }
    }

    console.error(
        "CONTENT VALIDATION PASSED"
    );

    return true;
}


// --------------------------------------------------
// QUIZ TOOL
// --------------------------------------------------

export async function quizFromNotes(topic) {

    console.error("QUIZ TOOL STARTED");


    // --------------------------------------------------
    // 1. CREATE VECTOR STORE
    // --------------------------------------------------

    await createVectorStore();

    console.error(
        "VECTOR STORE CREATED"
    );


    // --------------------------------------------------
    // 2. RETRIEVE RELEVANT NOTES
    // --------------------------------------------------

    const results = await retrieveRelevantChunks(
        topic,
        2
    );

    console.error(
        "RETRIEVAL COMPLETED"
    );


    // --------------------------------------------------
    // 3. CREATE CONTEXT
    // --------------------------------------------------

    const context = results
        .map((result) => result.content)
        .join("\n\n");

    console.error(
        "CONTEXT:"
    );

    console.error(context);


    // --------------------------------------------------
    // 4. CREATE LLM PROMPT
    // --------------------------------------------------

    const prompt = `
You are an AI Study Assistant.

Create a quiz using ONLY the study material provided below.

Study Material:
${context}

Topic:
${topic}

Create exactly 3 questions.

Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "correctAnswer": "A"
    }
  ]
}

IMPORTANT RULES:

1. Every question must be directly answerable from the study material.
2. The correct answer must be explicitly supported by the study material.
3. Do not infer information that is not stated.
4. Do not use outside knowledge.
5. Do not combine unrelated concepts.
6. Prefer exact terminology from the study material.
7. Most questions should focus directly on the requested topic.
8. Create exactly 3 questions.
9. Each question must have exactly 4 options.
10. Only one option can be correct.
11. correctAnswer must be A, B, C, or D.
12. Return ONLY JSON.
`;


    // --------------------------------------------------
    // 5. CALL LLM
    // --------------------------------------------------

    console.error(
        "CALLING LLM..."
    );

    const response = await generateText(
        prompt
    );

   console.error("LLM RESULT:");
console.error(response);

if (!response) {
    throw new Error(
        "LLM returned an empty response"
    );
}

let quiz;

    try {

        quiz = JSON.parse(response);

    } catch (error) {

        console.error(
            "INVALID JSON FROM LLM"
        );

        throw new Error(
            "LLM returned invalid JSON"
        );
    }


    // --------------------------------------------------
    // 7. VALIDATE QUIZ STRUCTURE
    // --------------------------------------------------

    if (
        !quiz.questions ||
        !Array.isArray(quiz.questions)
    ) {

        throw new Error(
            "Invalid quiz structure"
        );
    }


    // Must contain exactly 3 questions

    if (quiz.questions.length !== 3) {

        throw new Error(
            "Quiz must contain exactly 3 questions"
        );
    }


    // --------------------------------------------------
    // 8. VALIDATE EACH QUESTION
    // --------------------------------------------------

    for (const question of quiz.questions) {

        // Check required fields

        if (
            !question.question ||
            !question.options ||
            !question.correctAnswer
        ) {

            throw new Error(
                "Invalid question structure"
            );
        }


        // Check options

        const optionKeys = Object.keys(
            question.options
        );


        if (
            optionKeys.length !== 4 ||
            !["A", "B", "C", "D"].every(
                key => optionKeys.includes(key)
            )
        ) {

            throw new Error(
                "Each question must have A, B, C and D options"
            );
        }


        // Check correct answer

        if (
            !["A", "B", "C", "D"].includes(
                question.correctAnswer
            )
        ) {

            throw new Error(
                "Invalid correct answer"
            );
        }
    }


    // --------------------------------------------------
    // 9. VALIDATE CONTENT
    // --------------------------------------------------

    const isContentValid =
        validateQuizContent(
            quiz,
            context
        );


    if (!isContentValid) {

        throw new Error(
            "Quiz contains answers that are not supported by the study material"
        );
    }


    // --------------------------------------------------
    // 10. RETURN MCP RESULT
    // --------------------------------------------------

    return {

        topic,

        quiz,

        sources: results.map(
            (result) => ({
                source:
                    result.metadata.source,

                score:
                    result.score
            })
        )
    };
}