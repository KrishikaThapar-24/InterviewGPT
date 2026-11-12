import { Router } from "express";
import { getAIHealth } from "../controllers/ai.controller.js";

import { signup, login } from "../controllers/auth.controller.js";
const router = Router();

router.get("/health", getAIHealth);
router.post("/signup", signup);
router.post("/login", login);

export default router;