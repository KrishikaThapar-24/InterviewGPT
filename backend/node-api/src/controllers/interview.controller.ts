import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

import Interview from "../models/Interview.js";
import {
  generateQuestion,
  evaluateAnswer,
  generateInterviewReport,
} from "../services/ai.service.js";
import {
  createInterviewSchema,
  updateStatusSchema,
  generateQuestionSchema,
  saveAnswerSchema,
} from "../validators/interview.validator.js";

// --------------------------------------------------
// Helper: Validate route parameters
// --------------------------------------------------

function getParamId(value: string | string[] | undefined): string | null {
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
// Find an interview only if it belongs to the logged-in user.
async function findOwnedInterview(
  req: Request,
  interviewId: string
) {
  if (!req.userId) {
    return null;
  }

  return Interview.findOne({
    _id: interviewId,
    candidateId: req.userId,
  });
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
      candidateId: req.userId!,
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
    if (!req.userId) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const interviews = await Interview.find({
      candidateId: req.userId,
    })
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
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    const interview = await findOwnedInterview(req, interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
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
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    const parsed = updateStatusSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid status",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await findOwnedInterview(req, interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
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
      return res.status(400).json({ message: "Invalid interview ID" });
    }

    const parsed = generateQuestionSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid question generation request",
        errors: parsed.error.flatten(),
      });
    }

    const interview = await findOwnedInterview(req, interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot generate questions for a closed interview",
      });
    }

    // Cast so both possible response keys type-check.
    const result = (await generateQuestion({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      topic: parsed.data.topic,
    })) as unknown as Record<string, unknown>;

    const questionText = result.question ?? result.generated_question;

    if (typeof questionText !== "string" || !questionText.trim()) {
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

    const savedQuestion = interview.questions[interview.questions.length - 1];

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

    const interview = await findOwnedInterview(req, interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot modify a closed interview",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
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

    const interview = await findOwnedInterview(req, interviewId);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (isInterviewClosed(interview.status)) {
      return res.status(400).json({
        message: "Cannot evaluate answers in a closed interview",
      });
    }

    const question = interview.questions.id(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    if (!question.answer.trim()) {
      return res.status(400).json({
        message: "Save an answer before evaluating it",
      });
    }

    // Send the question and candidate's answer to Gemini.
    const result = (await evaluateAnswer({
      question: question.questionText,
      answer: question.answer,
      role: interview.role,
      experienceLevel: interview.experienceLevel,
    })) as unknown as Record<string, unknown>;

    // Validate Gemini's response.
    const isCorrect = result.is_correct;
    const followUpQuestion = result.follow_up_question;

    if (
      typeof isCorrect !== "boolean" ||
      typeof followUpQuestion !== "string" ||
      !followUpQuestion.trim()
    ) {
      return res.status(502).json({
        message: "AI service returned an invalid evaluation",
      });
    }

    const nextQuestionText = followUpQuestion.trim();

    // Save the evaluation against the current question.
    question.evaluation = {
      isCorrect,
      followUpQuestion: nextQuestionText,
    };

    // Prevent duplicate follow-up questions if this request is repeated.
    const alreadyExists = interview.questions.some(
      (existingQuestion) => existingQuestion.questionText === nextQuestionText
    );

    let nextQuestion = null;

    if (!alreadyExists) {
      interview.questions.push({
        questionText: nextQuestionText,
        answer: "",
        evaluation: null,
      });

      nextQuestion = interview.questions[interview.questions.length - 1];
    }

    await interview.save();

    return res.status(200).json({
      message: "Answer evaluated successfully",
      isCorrect,
      result: isCorrect ? "Correct" : "Incorrect",
      followUpQuestion: nextQuestionText,
      nextQuestion,
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
      return res.status(400).json({ message: "Invalid interview ID." });
    }

    const interview = await findOwnedInterview(req, interviewId);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }

    // Return an existing report instead of generating it again.
    if (interview.status === "completed" && interview.report) {
      return res.status(200).json({
        message: "Interview report retrieved successfully.",
        report: interview.report,
        interview,
      });
    }

    if (interview.status === "cancelled") {
      return res.status(400).json({
        message: "A cancelled interview cannot be completed.",
      });
    }

    const totalQuestions = interview.questions.length;

    const answeredQuestions = interview.questions.filter(
      (question) => question.answer.trim().length > 0
    );

    const evaluatedQuestions = answeredQuestions.filter(
      (question) => question.evaluation !== null
    );

    // Nothing to analyse, so don't call the AI service.
    if (evaluatedQuestions.length === 0) {
      return res.status(400).json({
        message: "Evaluate at least one answer before completing the interview.",
      });
    }

    const correctAnswers = evaluatedQuestions.filter(
      (question) => question.evaluation?.isCorrect === true
    ).length;

    const incorrectAnswers = evaluatedQuestions.filter(
      (question) => question.evaluation?.isCorrect === false
    ).length;

    const unansweredQuestions = totalQuestions - answeredQuestions.length;

    const accuracy = Number(
      ((correctAnswers / evaluatedQuestions.length) * 100).toFixed(2)
    );

    // Prepare questions for the Python AI service.
    const questionsForAI = evaluatedQuestions.map((question) => ({
      question_id: question._id.toString(),
      question_text: question.questionText,
      answer: question.answer,
      evaluation: {
        is_correct: question.evaluation!.isCorrect,
      },
    }));

    // Generate qualitative analysis using Gemini.
    const aiReport = (await generateInterviewReport({
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.interviewType,
      questions: questionsForAI,
    })) as unknown as Record<string, any>;

    const strengths = aiReport.strengths;
    const weaknesses = aiReport.weaknesses;
    const feedback = aiReport.question_feedback;

    if (
      !Array.isArray(strengths) ||
      !Array.isArray(weaknesses) ||
      !Array.isArray(feedback)
    ) {
      return res.status(502).json({
        message: "AI service returned an invalid report.",
      });
    }

    // Match AI feedback with the corresponding MongoDB question.
    const feedbackById = new Map<string, string>(
      feedback.map((item: any) => [
        String(item.question_id),
        String(item.explanation),
      ])
    );

    const questionFeedback = evaluatedQuestions.map((question) => {
      const questionId = question._id.toString();
      const explanation = feedbackById.get(questionId);

      if (!explanation) {
        throw new Error(`Missing AI feedback for question ${questionId}.`);
      }

      return {
        questionId,
        questionText: question.questionText,
        answer: question.answer,
        isCorrect: question.evaluation!.isCorrect,
        explanation,
      };
    });

    // Save the final report in MongoDB.
    interview.set("report", {
      totalQuestions,
      answeredQuestions: answeredQuestions.length,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      accuracy,
      strengths: strengths.map(String),
      weaknesses: weaknesses.map(String),
      questionFeedback,
      generatedAt: new Date(),
    });

    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      message: "Interview completed successfully.",
      report: interview.report,
      interview,
    });
  } catch (error) {
    next(error);
  }
}