import axios from "axios";
import FormData from "form-data";

function getAIServiceUrl(): string {
  return process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
}

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

export interface GenerateInterviewReportInput {
  role: string;
  experienceLevel: string;
  interviewType: string;
  questions: {
    question_id: string;
    question_text: string;
    answer: string;
    evaluation: { is_correct: boolean } | null;
  }[];
}

export interface AnalyzeResumeInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface ResumeAnalysisResponse {
  professional_summary?: string;
  skills?: string[];
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    key_concepts?: string[];
  }>;
  experience?: string[];
  education?: string[];
  strengths?: string[];
  improvement_areas?: string[];
  [key: string]: unknown;
}

export interface AnalyzeResumeResponse {
  message?: string;
  file_type?: string;
  character_count?: number;
  analysis: ResumeAnalysisResponse;
}

export interface ResumeQuestionResponse {
  question: string;
  category: "Project" | "Technical" | "Conceptual" | "Experience" | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
  related_project?: string;
  topic?: string;
  expected_concepts?: string[];
}

export interface GenerateResumeQuestionsInput {
  analysis: ResumeAnalysisResponse;
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  numberOfQuestions: number;
}

export async function checkAIService() {
  const response = await axios.get(`${getAIServiceUrl()}/health`, { timeout: 10000 });
  return response.data;
}

export async function generateQuestion(input: GenerateQuestionInput): Promise<Record<string, unknown>> {
  const response = await axios.post(`${getAIServiceUrl()}/generate-question`, {
    role: input.role,
    experience_level: input.experienceLevel,
    topic: input.topic,
  }, { timeout: 60000 });
  return response.data as Record<string, unknown>;
}

export async function evaluateAnswer(input: EvaluateAnswerInput): Promise<Record<string, unknown>> {
  const response = await axios.post(`${getAIServiceUrl()}/evaluate-answer`, {
    question: input.question,
    answer: input.answer,
    role: input.role,
    experience_level: input.experienceLevel,
  }, { timeout: 60000 });
  return response.data as Record<string, unknown>;
}

export async function generateInterviewReport(input: GenerateInterviewReportInput): Promise<Record<string, unknown>> {
  const response = await axios.post(`${getAIServiceUrl()}/generate-report`, {
    role: input.role,
    experience_level: input.experienceLevel,
    interview_type: input.interviewType,
    questions: input.questions,
  }, { timeout: 120000 });
  return response.data as Record<string, unknown>;
}

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeResponse> {
  const form = new FormData();
  form.append("resume", input.buffer, {
    filename: input.originalName,
    contentType: input.mimeType,
  });

  const response = await axios.post<AnalyzeResumeResponse>(
    `${getAIServiceUrl()}/resume/analyze`,
    form,
    {
      headers: form.getHeaders(),
      timeout: 120000,
      maxBodyLength: 6 * 1024 * 1024,
      maxContentLength: 2 * 1024 * 1024,
    }
  );
  return response.data;
}

export async function generateResumeQuestions(
  input: GenerateResumeQuestionsInput
): Promise<{ questions: ResumeQuestionResponse[] }> {
  const response = await axios.post<{ questions: ResumeQuestionResponse[] }>(
    `${getAIServiceUrl()}/resume/generate-questions`,
    {
      analysis: input.analysis,
      role: input.role,
      experience_level: input.experienceLevel,
      interview_type: input.interviewType,
      difficulty: input.difficulty,
      number_of_questions: input.numberOfQuestions,
    },
    { timeout: 120000, maxContentLength: 2 * 1024 * 1024 }
  );
  return response.data;
}
