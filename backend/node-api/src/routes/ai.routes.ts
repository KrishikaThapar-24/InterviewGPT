import { Router } from "express";
import { getAIHealth } from "../controllers/ai.controller.js";

const router = Router();

router.get("/health", getAIHealth);

export default router;