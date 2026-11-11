
import { Router } from "express";

import {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterviewStatus,
  generateInterviewQuestion,
  saveInterviewAnswer,
  evaluateInterviewAnswer,
  completeInterview,
} from "../controllers/interview.controller.js";

const router = Router();

// Create a new interview
router.post("/", createInterview);

// Get all interviews
router.get("/", getInterviews);

// Get a specific interview
router.get("/:id", getInterviewById);

// Update interview status
router.patch("/:id/status", updateInterviewStatus);

// Generate a new question
router.post("/:id/questions/generate", generateInterviewQuestion);

// Save candidate's answer
router.patch("/:id/questions/:questionId/answer", saveInterviewAnswer);

// Evaluate candidate's answer
router.post("/:id/questions/:questionId/evaluate", evaluateInterviewAnswer);

// Complete an interview
router.post("/:id/complete", completeInterview);

export default router;
