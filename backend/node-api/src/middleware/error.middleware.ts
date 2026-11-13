import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import axios from "axios";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "Resume file must be 5 MB or smaller." });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE" || error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "Upload exactly one file using the 'resume' field." });
    }
    return res.status(400).json({ message: "Resume upload was rejected." });
  }

  if (error instanceof Error && error.message.includes("Only PDF and DOCX")) {
    return res.status(400).json({ message: error.message });
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const safeMessage = status === 400
      ? "The uploaded resume could not be processed. Check that it is a valid, readable PDF or DOCX."
      : "The AI service is currently unavailable or could not process the request. Please try again.";
    console.error("AI service request failed:", {
      status,
      code: error.code,
      message: error.message,
    });
    return res.status(status === 400 ? 400 : 502).json({ message: safeMessage });
  }

  console.error("Unhandled API error:", error);
  return res.status(500).json({ message: "An unexpected server error occurred." });
}
