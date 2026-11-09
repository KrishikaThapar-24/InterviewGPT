
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to InterviewGPT API",
    status: "running",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "InterviewGPT Node API",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`InterviewGPT API running on port ${PORT}`);
  });
};

startServer();
