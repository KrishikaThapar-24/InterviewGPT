import "dotenv/config";
import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import aiRoutes from "./routes/ai.routes.js";
import interviewRoutes from "./routes/interview.routes.js";
import authRoutes from "./routes/auth.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to InterviewGPT API", status: "running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "healthy", service: "InterviewGPT Node API" });
});

app.use("/api/interviews", interviewRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

// Error middleware must be registered after every route.
app.use(errorHandler);

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`InterviewGPT API running on port ${PORT}`);
  });
}

startServer().catch((error: unknown) => {
  console.error("Failed to start InterviewGPT API:", error);
  process.exit(1);
});
