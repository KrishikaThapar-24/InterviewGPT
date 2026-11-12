
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders, getToken, clearSession } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Interview {
  _id: string;
  role: string;
  company?: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
  report?: {
    accuracy: number;
    correctAnswers: number;
    incorrectAnswers: number;
    totalQuestions: number;
    unansweredQuestions: number;
  } | null;
}

export default function HistoryPage() {
  const router = useRouter();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchInterviews() {
      try {
        setLoading(true);
        setError("");
        const token = getToken();

        if (!token) {
           router.replace("/login");
           return;
        }

        const response = await fetch(`${API_URL}/api/interviews`, {
  headers: {
    ...authHeaders(),
  },
});

if (response.status === 401) {
  clearSession();
  router.replace("/login");
  return;
}

        if (!response.ok) {
          throw new Error("Unable to fetch interview history.");
        }

        const data = await response.json();
        setInterviews(data.interviews || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInterviews();
  }, [router]);

  const completedCount = interviews.filter(
    (item) => item.status === "completed"
  ).length;

  const inProgressCount = interviews.filter(
    (item) => item.status === "in-progress"
  ).length;

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch =
        interview.role.toLowerCase().includes(search.toLowerCase()) ||
        (interview.company || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" || interview.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [interviews, search, filter]);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "completed":
        return "history-status completed";
      case "in-progress":
        return "history-status in-progress";
      case "cancelled":
        return "history-status cancelled";
      default:
        return "history-status scheduled";
    }
  }

  return (
    <main className="history-page">
      <div className="history-header">
        <div>
          <p className="history-eyebrow">YOUR ACTIVITY</p>
          <h1>Interview History</h1>
          <p className="history-subtitle">
            Review your previous interviews and track your progress.
          </p>
        </div>

        <Link href="/interview" className="history-new-button">
          + New Interview
        </Link>
      </div>

      <section className="history-stats">
        <div className="history-stat-card">
          <span>Total Interviews</span>
          <strong>{interviews.length}</strong>
        </div>

        <div className="history-stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="history-stat-card">
          <span>In Progress</span>
          <strong>{inProgressCount}</strong>
        </div>
      </section>

      <section className="history-content">
        <div className="history-toolbar">
          <input
            type="text"
            placeholder="Search by role or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="history-search"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="history-filter"
          >
            <option value="all">All Interviews</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="scheduled">Scheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading && (
          <div className="history-message">
            Loading your interview history...
          </div>
        )}

        {!loading && error && (
          <div className="history-error">{error}</div>
        )}

        {!loading && !error && interviews.length === 0 && (
          <div className="history-empty">
            <h2>No interviews yet</h2>
            <p>Your completed and ongoing interviews will appear here.</p>
            <Link href="/interview" className="history-new-button">
              Start Your First Interview
            </Link>
          </div>
        )}

        {!loading && !error && interviews.length > 0 &&
          filteredInterviews.length === 0 && (
            <div className="history-message">
              No interviews match your search.
            </div>
          )}

        {!loading && !error && filteredInterviews.map((interview) => (
          <article className="history-card" key={interview._id}>
            <div className="history-card-top">
              <div>
                <h2>{interview.role}</h2>
                {interview.company && (
                  <p className="history-company">{interview.company}</p>
                )}
              </div>

              <span className={getStatusClass(interview.status)}>
                {interview.status.replace("-", " ")}
              </span>
            </div>

            <div className="history-details">
              <span>{interview.interviewType}</span>
              <span>{interview.experienceLevel}</span>
              <span>{interview.difficulty}</span>
              <span>{formatDate(interview.createdAt)}</span>
            </div>

            {interview.status === "completed" && interview.report && (
              <div className="history-score">
                <div>
                  <strong>{interview.report.accuracy}%</strong>
                  <span>Accuracy</span>
                </div>
                <div>
                  <strong>{interview.report.correctAnswers}</strong>
                  <span>Correct</span>
                </div>
                <div>
                  <strong>{interview.report.incorrectAnswers}</strong>
                  <span>Incorrect</span>
                </div>
              </div>
            )}

            <div className="history-card-footer">
              {interview.status === "completed" ? (
                <Link
                  href={`/interview/${interview._id}/report`}
                  className="history-action"
                >
                  View Report →
                </Link>
              ) : interview.status === "in-progress" ||
                interview.status === "scheduled" ? (
                <Link
                  href={`/interview/${interview._id}`}
                  className="history-action"
                >
                  Continue Interview →
                </Link>
              ) : (
                <span className="history-muted">
                  This interview was cancelled.
                </span>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
