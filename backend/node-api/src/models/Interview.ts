
import { Schema, model, type InferSchemaType } from "mongoose";

const answerEvaluationSchema = new Schema(
  {
    isCorrect: {
      type: Boolean,
      required: true,
    },
    followUpQuestion: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    questionText: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: "",
    },
    evaluation: {
      type: answerEvaluationSchema,
      default: null,
    },
    category: {
      type: String,
      enum: ["Project", "Technical", "Conceptual", "Experience", "Behavioral"],
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
    },
    relatedProject: { type: String, default: "" },
    topic: { type: String, default: "" },
    expectedConcepts: { type: [String], default: [] },
  },
  { timestamps: true }
);

// AI-generated explanation for each evaluated answer
const questionFeedbackSchema = new Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Final interview report
const reportSchema = new Schema(
  {
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      required: true,
      default: 0,
    },
    unansweredQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      default: 0,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    questionFeedback: {
      type: [questionFeedbackSchema],
      default: [],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const interviewSchema = new Schema(
  {
    candidateId: {
      type: String,
      default: null,
    },
    interviewMode: {
      type: String,
      enum: ["standard", "resume-based"],
      default: "standard",
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher", "Junior", "Mid-level", "Senior"],
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["Technical", "Behavioral", "Mixed"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["scheduled", "in-progress", "completed", "cancelled"],
      default: "scheduled",
    },
    questions: {
      type: [questionSchema],
      default: [],
    },
    report: {
      type: reportSchema,
      default: null,
    },
  },
  { timestamps: true }
);

export type InterviewDocument = InferSchemaType<typeof interviewSchema>;

const Interview = model("Interview", interviewSchema);

export default Interview;