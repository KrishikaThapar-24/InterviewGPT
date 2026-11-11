
import type { Request, Response, NextFunction } from "express";
import { checkAIService } from "../services/ai.service.js";

export async function getAIHealth(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await checkAIService();

    return res.status(200).json({
      status: "connected",
      service: "InterviewGPT AI Service",
      details: result,
    });
  } catch (error) {
    next(error);
  }
}

