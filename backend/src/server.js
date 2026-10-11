import express from "express";
import cors from "cors";
import agentRoutes from "./routes/agentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", agentRoutes);

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});