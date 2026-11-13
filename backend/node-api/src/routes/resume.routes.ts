import { Router } from "express";
import { protect } from "../middleware/auth.middleware.js";
import { uploadResume } from "../middleware/upload.middleware.js";
import { createResumeBasedInterview, analyzeResumeOnly } from "../controllers/resume.controller.js";

const router = Router();

router.use(protect);
router.post("/create-interview", uploadResume, createResumeBasedInterview);
router.post("/analyze", uploadResume, analyzeResumeOnly);

export default router;
