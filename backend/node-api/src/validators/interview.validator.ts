
import { z } from "zod";

export const createInterviewSchema = z.object({
  role: z.string().min(2, "Role must contain at least 2 characters"),
  company: z.string().optional().default(""),
  candidateId: z.string().optional(),
  experienceLevel: z.enum([
    "Fresher",
    "Junior",
    "Mid-level",
    "Senior",
  ]),
  interviewType: z.enum([
    "Technical",
    "Behavioral",
    "Mixed",
  ]),
  difficulty: z.enum([
    "Easy",
    "Medium",
    "Hard",
  ]).optional().default("Medium"),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    "scheduled",
    "in-progress",
    "completed",
    "cancelled",
  ]),
});

export const generateQuestionSchema = z.object({
  topic: z.string().optional().default("General"),
});

export const saveAnswerSchema = z.object({
  answer: z.string().min(1, "Answer cannot be empty"),
});
