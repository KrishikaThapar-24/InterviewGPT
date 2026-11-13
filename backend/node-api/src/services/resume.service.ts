import type { Express } from "express";
import {
  analyzeResume,
  generateResumeQuestions,
  type ResumeAnalysisResponse,
  type ResumeQuestionResponse,
} from "./ai.service.js";

export interface ResumeInterviewSettings {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  numberOfQuestions: number;
}

export interface ResumeInterviewGeneration {
  analysis: ResumeAnalysisResponse;
  questions: ResumeQuestionResponse[];
}

/** Processes the uploaded buffer only; it does not write the resume to disk. */
export async function generateResumeInterviewContent(
  file: Express.Multer.File,
  settings: ResumeInterviewSettings
): Promise<ResumeInterviewGeneration> {
  const analysisResponse = await analyzeResume({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
  });

  if (!analysisResponse.analysis || typeof analysisResponse.analysis !== "object") {
    throw new Error("AI service returned an invalid resume analysis.");
  }

  const questionResponse = await generateResumeQuestions({
    analysis: analysisResponse.analysis,
    ...settings,
  });

  if (
    !Array.isArray(questionResponse.questions) ||
    questionResponse.questions.length !== settings.numberOfQuestions
  ) {
    throw new Error("AI service returned an invalid set of interview questions.");
  }

  return {
    analysis: analysisResponse.analysis,
    questions: questionResponse.questions,
  };
}
