
import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Interview from "../models/Interview.js";

import {
  createInterviewSchema,
  updateStatusSchema,
  generateQuestionSchema,
  saveAnswerSchema,
} from "../validators/interview.validator.js";

import {
  generateQuestion,
  evaluateAnswer,
} from "../services/ai.service.js";

// --------------------------------------------------
// Helper: Validate route parameters
// --------------------------------------------------

function getParamId(
  value: string | string[] | undefined
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!mongoose.isValidObjectId(value)) {
    return null;
  }

  return value;
}

// --------------------------------------------------
// Helper: Check whether an interview is editable
// --------------------------------------------------

function isInterviewClosed(status: string): boolean {
  return status === "completed" || status === "cancelled";
}

// --------------------------------------------------
// 1. CREATE INTERVIEW
// POST /api/interviews
// --------------------------------------------------

export async function createInterview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = createInterviewSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid interview details",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await Interview.create({
      role: parsed.data.role,
      company: parsed.data.company,
      candidateId: parsed.data.candidateId ?? null,
      experienceLevel: parsed.data.experienceLevel,
      interviewType: parsed.data.interviewType,
      difficulty: parsed.data.difficulty,
      status: "scheduled",
      questions: [],
    });

    return res.status(201).json({
      message: "Interview created successfully",
      interview,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 2. GET ALL INTERVIEWS
// GET /api/interviews
// --------------------------------------------------

export async function getInterviews(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const candidateId =
      typeof req.query.candidateId === "string"
        ? req.query.candidateId
        : undefined;

    const filter = candidateId ? { candidateId } : {};

    const interviews = await Interview.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      count: interviews.length,
      interviews,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 3. GET INTERVIEW BY ID
// GET /api/interviews/:id
// --------------------------------------------------

export async function getInterviewById(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    return res.status(200).json({ interview });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 4. UPDATE INTERVIEW STATUS
// PATCH /api/interviews/:id/status
// --------------------------------------------------

export async function updateInterviewStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const parsed = updateStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid status",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot modify a completed or cancelled interview",
      });
    }

    // Completing an interview must use the dedicated
    // endpoint so the final score is calculated.
    if (parsed.data.status === "completed") {
      return res.status(400).json({
        message: "Use POST /api/interviews/:id/complete",
      });
    }

    interview.status = parsed.data.status;

    await interview.save();

    return res.status(200).json({
      message: "Interview status updated successfully",
      interview,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 5. GENERATE INTERVIEW QUESTION
// POST /api/interviews/:id/questions/generate
// --------------------------------------------------

export async function generateInterviewQuestion(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const parsed = generateQuestionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid question generation request",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot generate questions for a closed interview",
      });
    }

    const result = await generateQuestion({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      topic: parsed.data.topic,
    });

    const questionText =
      result.question ?? result.generated_question;

    if (
      typeof questionText !== "string" ||
      !questionText.trim()
    ) {
      return res.status(502).json({
        message: "AI service returned an invalid question",
      });
    }

    interview.questions.push({
      questionText: questionText.trim(),
      answer: "",
      evaluation: null,
    });

    interview.status = "in-progress";

    await interview.save();

    const savedQuestion =
      interview.questions[interview.questions.length - 1];

    return res.status(201).json({
      message: "Question generated successfully",
      interviewId: interview.id,
      question: savedQuestion,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 6. SAVE CANDIDATE ANSWER
// PATCH /api/interviews/:id/questions/:questionId/answer
// --------------------------------------------------

export async function saveInterviewAnswer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);
    const questionId = getParamId(req.params.questionId);

    if (!interviewId || !questionId) {
      return res.status(400).json({
        message: "Invalid interview ID or question ID",
      });
    }

    const parsed = saveAnswerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid answer",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot modify a closed interview",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    question.answer = parsed.data.answer;

    // Previous evaluation is no longer valid
    // when the candidate changes the answer.
    question.evaluation = null;

    await interview.save();

    return res.status(200).json({
      message: "Answer saved successfully",
      question,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 7. EVALUATE ANSWER USING GEMINI
// POST /api/interviews/:id/questions/:questionId/evaluate
// --------------------------------------------------

export async function evaluateInterviewAnswer(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);
    const questionId = getParamId(req.params.questionId);

    if (!interviewId || !questionId) {
      return res.status(400).json({
        message: "Invalid interview ID or question ID",
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot evaluate answers in a closed interview",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    if (!question.answer.trim()) {
      return res.status(400).json({
        message: "Save an answer before evaluating it",
      });
    }

    const result = await evaluateAnswer({
      question: question.questionText,
      answer: question.answer,
      role: interview.role,
      experienceLevel: interview.experienceLevel,
    });

    // Supports camelCase and snake_case responses.
    function readNumber(
      camelCase: string,
      snakeCase: string
    ): number | undefined {
      const value =
        result[camelCase] ?? result[snakeCase];

      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 100
      ) {
        return undefined;
      }

      return value;
    }

    function readStringArray(key: string): string[] {
      const value = result[key];

      return Array.isArray(value)
        ? value.filter(
            (item): item is string =>
              typeof item === "string"
          )
        : [];
    }

    function readString(
      camelCase: string,
      snakeCase: string
    ): string {
      const value =
        result[camelCase] ?? result[snakeCase];

      return typeof value === "string" ? value : "";
    }

    const overallScore = readNumber(
      "overallScore",
      "overall_score"
    );

    if (overallScore === undefined) {
      return res.status(502).json({
        message: "AI service returned an invalid overall score",
      });
    }

    const evaluation = {
      technicalAccuracy:
        readNumber("technicalAccuracy", "technical_accuracy") ?? 0,
      communication:
        readNumber("communication", "communication") ?? 0,
      problemSolving:
        readNumber("problemSolving", "problem_solving") ?? 0,
      overallScore,
      strengths: readStringArray("strengths"),
      weaknesses: readStringArray("weaknesses"),
      feedback: readString("feedback", "feedback"),
      followUpQuestion: readString(
        "followUpQuestion",
        "follow_up_question"
      ),
    };

    question.evaluation = evaluation;

    await interview.save();

    return res.status(200).json({
      message: "Answer evaluated successfully",
      evaluation,
    });
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// 8. COMPLETE INTERVIEW
// POST /api/interviews/:id/complete
// --------------------------------------------------

export async function completeInterview(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const interviewId = getParamId(req.params.id);

    if (!interviewId) {
      return res.status(400).json({
        message: "Invalid interview ID",
      });
    }

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Interview is already closed",
      });
    }

    const scores = interview.questions
      .map((question) => question.evaluation?.overallScore)
      .filter(
        (score): score is number =>
          typeof score === "number" &&
          Number.isFinite(score)
      );

    if (scores.length === 0) {
      return res.status(400).json({
        message:
          "Evaluate at least one answer before completing the interview",
      });
    }

    // Average of evaluated answers only.
    const totalScore = scores.reduce(
      (sum, score) => sum + score,
      0
    );

    const averageScore = totalScore / scores.length;

    interview.overallScore = Math.round(averageScore);
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      message: "Interview completed successfully",
      overallScore: interview.overallScore,
      evaluatedAnswers: scores.length,
      interview,
    });
  } catch (error) {
    next(error);
  }
}
