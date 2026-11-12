
"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock,
  Download,
  FileChartColumnIncreasing,
  Loader2,
  XCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Question = {
  _id: string;
  questionText: string;
  answer: string;
  evaluation: {
    isCorrect: boolean;
    followUpQuestion: string;
  } | null;
};

type QuestionFeedback = {
  questionId: string;
  questionText: string;
  answer: string;
  isCorrect: boolean;
  explanation: string;
};

type InterviewReport = {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  questionFeedback: QuestionFeedback[];
  generatedAt: string;
};

type Interview = {
  _id: string;
  role: string;
  company?: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  status: string;
  questions: Question[];
  report: InterviewReport | null;
};

function InterviewReportContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const interviewId = params.id;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(
          `${API_URL}/api/interviews/${interviewId}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load interview report.");
        }

        if (!data.interview?.report) {
          throw new Error("The report has not been generated yet.");
        }

        setInterview(data.interview);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load report."
        );
      } finally {
        setLoading(false);
      }
    }

    void fetchReport();
  }, [interviewId]);

  const downloadReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <main className="report-loading">
        <Loader2 size={34} className="animate-spin" />
        <p>Preparing your interview report...</p>
      </main>
    );
  }

  if (error || !interview?.report) {
    return (
      <main className="report-loading">
        <CircleAlert size={34} />
        <p>{error || "Report unavailable."}</p>
        <button onClick={() => router.push("/")}>
          Back to dashboard
        </button>
      </main>
    );
  }

  const report = interview.report;

  return (
    <main className="report-page">
      <header className="report-header">
        <button
          className="report-back"
          onClick={() => router.push("/")}
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>

        <div className="report-brand">
          <FileChartColumnIncreasing size={21} />
          InterviewGPT
        </div>

        <button className="report-download" onClick={downloadReport}>
          <Download size={17} />
          Download / Print
        </button>
      </header>

      <div className="report-container">
        <section className="report-intro">
          <span className="report-completed">
            <CheckCircle2 size={15} />
            Interview completed
          </span>

          <h1>Your Interview Report</h1>

          <p>
            {interview.role}
            {interview.company ? ` at ${interview.company}` : ""} ·{" "}
            {interview.experienceLevel} · {interview.interviewType}
          </p>

          <span className="report-date">
            <Clock size={14} />
            Generated{" "}
            {new Date(report.generatedAt).toLocaleString()}
          </span>
        </section>

        <section className="report-score-card">
          <div className="report-score-main">
            <span>OVERALL ACCURACY</span>
            <strong>{report.accuracy}%</strong>
            <p>Based on evaluated answers</p>
          </div>

          <div className="report-score-stats">
            <div>
              <strong className="report-green">
                {report.correctAnswers}
              </strong>
              <span>Correct answers</span>
            </div>

            <div>
              <strong className="report-red">
                {report.incorrectAnswers}
              </strong>
              <span>Incorrect answers</span>
            </div>

            <div>
              <strong>{report.totalQuestions}</strong>
              <span>Questions asked</span>
            </div>

            <div>
              <strong>{report.unansweredQuestions}</strong>
              <span>Unanswered</span>
            </div>
          </div>

          <div className="report-progress-track">
            <div
              className="report-progress-fill"
              style={{
                width: `${Math.min(100, Math.max(0, report.accuracy))}%`,
              }}
            />
          </div>
        </section>

        <section className="report-analysis-grid">
          <div className="report-analysis-card">
            <div className="report-analysis-title">
              <CheckCircle2 className="report-green" size={21} />
              <h2>Your Strengths</h2>
            </div>

            {report.strengths.length > 0 ? (
              <ul>
                {report.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            ) : (
              <p className="report-empty">
                Not enough evaluated answers to identify strengths.
              </p>
            )}
          </div>

          <div className="report-analysis-card">
            <div className="report-analysis-title">
              <CircleAlert className="report-amber" size={21} />
              <h2>Areas to Improve</h2>
            </div>

            {report.weaknesses.length > 0 ? (
              <ul>
                {report.weaknesses.map((weakness, index) => (
                  <li key={index}>{weakness}</li>
                ))}
              </ul>
            ) : (
              <p className="report-empty">
                No specific improvement areas identified.
              </p>
            )}
          </div>
        </section>

        <section className="report-questions">
          <div className="report-section-heading">
            <div>
              <h2>Question-wise Analysis</h2>
              <p>Review every question and your submitted answer.</p>
            </div>
            <span>{report.totalQuestions} questions</span>
          </div>

          {interview.questions.map((question, index) => {
            const feedback = report.questionFeedback.find(
              (item) => item.questionId === question._id
            );

            const answered = Boolean(question.answer?.trim());
            const evaluated = Boolean(question.evaluation);

            return (
              <article
                className="report-question-card"
                key={question._id}
              >
                <div className="report-question-top">
                  <span className="report-question-number">
                    QUESTION {index + 1}
                  </span>

                  {!answered ? (
                    <span className="report-status unanswered">
                      <CircleAlert size={14} />
                      Unanswered
                    </span>
                  ) : !evaluated ? (
                    <span className="report-status unanswered">
                      <CircleAlert size={14} />
                      Not evaluated
                    </span>
                  ) : question.evaluation!.isCorrect ? (
                    <span className="report-status correct">
                      <CheckCircle2 size={14} />
                      Correct
                    </span>
                  ) : (
                    <span className="report-status incorrect">
                      <XCircle size={14} />
                      Incorrect
                    </span>
                  )}
                </div>

                <h3>{question.questionText}</h3>

                <div className="report-answer">
                  <span>YOUR ANSWER</span>
                  <p>
                    {answered
                      ? question.answer
                      : "No answer submitted."}
                  </p>
                </div>

                {feedback && (
                  <div className="report-feedback">
                    <span>AI ASSESSMENT</span>
                    <p>{feedback.explanation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <footer className="report-footer">
          <p>InterviewGPT · Your personal AI interview assessment</p>
          <button onClick={() => router.push("/")}>
            Return to Dashboard
          </button>
        </footer>
      </div>
    </main>
  );
}

export default function InterviewReportPage() {
  return (
    <Suspense
      fallback={
        <main className="interview-loading">
          <p>Loading your interview report...</p>
        </main>
      }
    >
      <InterviewReportContent />
    </Suspense>
  );
}