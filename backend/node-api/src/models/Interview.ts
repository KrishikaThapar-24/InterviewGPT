
import { Schema, model, type InferSchemaType } from "mongoose";

const answerEvaluationSchema = new Schema(
  {
    technicalAccuracy: {
      type: Number,
      min: 0,
      max: 100,
    },
    communication: {
      type: Number,
      min: 0,
      max: 100,
    },
    problemSolving: {
      type: Number,
      min: 0,
      max: 100,
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    feedback: {
      type: String,
      default: "",
    },
    followUpQuestion: {
      type: String,
      default: "",
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
  },
  { timestamps: true }
);

const interviewSchema = new Schema(
  {
    candidateId: {
      type: String,
      default: null,
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
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export type InterviewDocument = InferSchemaType<typeof interviewSchema>;

const Interview = model("Interview", interviewSchema);

export default Interview;
