import express from "express";
import { runAgent } from "../agent/agent.js";

const router = express.Router();

router.post("/agent", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required"
            });
        }

        const result = await runAgent(message);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error("Agent API Error:", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

export default router;