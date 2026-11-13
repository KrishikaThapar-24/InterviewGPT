import type { Request, Response, NextFunction } from "express";
import Interview from "../models/Interview.js";
import { createResumeInterviewSchema } from "../validators/interview.validator.js";
import { generateResumeInterviewContent } from "../services/resume.service.js";
import { analyzeResume } from "../services/ai.service.js";

const allowedCategories = new Set([
  "Project",
  "Technical",
  "Conceptual",
  "Experience",
  "Behavioral",
]);
const allowedDifficulties = new Set(["Easy", "Medium", "Hard"]);

export async function createResumeBasedInterview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a PDF or DOCX resume." });
    }

    const parsed = createResumeInterviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid resume interview settings.",
        errors: parsed.error.flatten(),
      });
    }

    const generated = await generateResumeInterviewContent(req.file, parsed.data);

    const questions = generated.questions.map((item) => {
      if (
        typeof item.question !== "string" ||
        !item.question.trim() ||
        !allowedCategories.has(item.category) ||
        !allowedDifficulties.has(item.difficulty)
      ) {
        throw new Error("AI service returned a malformed interview question.");
      }

      return {
        questionText: item.question.trim(),
        answer: "",
        evaluation: null,
        category: item.category,
        difficulty: item.difficulty,
        relatedProject: item.related_project ?? "",
        topic: item.topic ?? "",
        expectedConcepts: Array.isArray(item.expected_concepts)
          ? item.expected_concepts
          : [],
      };
    });

    // Persist only interview settings and generated questions. Never persist
    // the uploaded file, extracted resume text, or resume analysis.
    const interview = await Interview.create({
      candidateId: req.userId,
      interviewMode: "resume-based",
      role: parsed.data.role,
      company: "",
      experienceLevel: parsed.data.experienceLevel,
      interviewType: parsed.data.interviewType,
      difficulty: parsed.data.difficulty,
      status: "scheduled",
      questions,
    });

    return res.status(201).json({
      message: "Resume-based interview created successfully.",
      interview,
      resumeAnalysis: generated.analysis,
    });
  } catch (error) {
    next(error);
  }
}


// Standalone resume analysis: returns insights without creating an interview.
export async function analyzeResumeOnly(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.userId) return res.status(401).json({ message: "Authentication required." });
    if (!req.file) return res.status(400).json({ message: "Please upload a PDF or DOCX resume." });
    const result = await analyzeResume({ buffer: req.file.buffer, originalName: req.file.originalname, mimeType: req.file.mimetype });
    // Do not persist the uploaded file, extracted text, or analysis.
    return res.status(200).json({ message: "Resume analyzed successfully.", analysis: result.analysis, fileType: result.file_type, characterCount: result.character_count });
  } catch (error) { next(error); }
}
