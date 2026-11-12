
import axios from "axios";
import FormData from "form-data";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export interface GenerateQuestionInput {
  role: string;
  experienceLevel: string;
  topic: string;
}

export interface EvaluateAnswerInput {
  question: string;
  answer: string;
  role: string;
  experienceLevel: string;
}

export async function checkAIService() {
  const response = await axios.get(
    `${AI_SERVICE_URL}/health`,
    { timeout: 10000 }
  );

  return response.data;
}

export async function generateQuestion(
  input: GenerateQuestionInput
): Promise<Record<string, unknown>> {
  const response = await axios.post(
    `${AI_SERVICE_URL}/generate-question`,
    {
      role: input.role,
      experience_level: input.experienceLevel,
      topic: input.topic,
    },
    { timeout: 60000 }
  );

  return response.data as Record<string, unknown>;
}

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<Record<string, unknown>> {
  const response = await axios.post(
    `${AI_SERVICE_URL}/evaluate-answer`,
    {
      question: input.question,
      answer: input.answer,
      role: input.role,
      experience_level: input.experienceLevel,
    },
    { timeout: 60000 }
  );

  return response.data as Record<string, unknown>;
}
export interface GenerateInterviewReportInput {
  role: string;
  experienceLevel: string;
  interviewType: string;
  questions: {
    question_id: string;
    question_text: string;
    answer: string;
    evaluation: {
      is_correct: boolean;
    } | null;
  }[];
}

export async function generateInterviewReport(
  input: GenerateInterviewReportInput
): Promise<Record<string, unknown>> {
  const response = await axios.post(
    `${AI_SERVICE_URL}/generate-report`,
    {
      role: input.role,
      experience_level: input.experienceLevel,
      interview_type: input.interviewType,
      questions: input.questions,
    },
    { timeout: 120000 }
  );

  return response.data as Record<string, unknown>;
}

// Input required to analyze an uploaded resume.
export interface AnalyzeResumeInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

// Forward the resume to the Python AI service.
export async function analyzeResume(
  input: AnalyzeResumeInput
): Promise<Record<string, unknown>> {
  const form = new FormData();

  form.append("resume", input.buffer, {
    filename: input.originalName,
    contentType: input.mimeType,
  });

  const response = await axios.post(
    `${AI_SERVICE_URL}/resume/analyze`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 120000,
      maxBodyLength: 10 * 1024 * 1024,
    }
  );

  return response.data as Record<string, unknown>;
}
