
import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";

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

// Every interview endpoint requires authentication.
router.use(protect);

router.post("/", createInterview);
router.get("/", getInterviews);
router.get("/:id", getInterviewById);
router.patch("/:id/status", updateInterviewStatus);
router.post("/:id/questions/generate", generateInterviewQuestion);
router.patch("/:id/questions/:questionId/answer", saveInterviewAnswer);
router.post("/:id/questions/:questionId/evaluate", evaluateInterviewAnswer);
router.post("/:id/complete", completeInterview);

export default router;
