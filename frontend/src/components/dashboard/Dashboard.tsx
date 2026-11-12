"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getToken,clearSession, getUser } from "@/lib/auth";

import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  History,
  LayoutDashboard,
  Mic,
  Sparkles,
  TrendingUp,
  UserRound,
  XCircle,
} from "lucide-react";


interface InterviewReport {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unansweredQuestions: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  generatedAt: string;
}

interface Interview {
  _id: string;
  role: string;
  company?: string;
  interviewType: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  createdAt: string;
  report?: InterviewReport | null;
}

interface InterviewApiResponse {
  count: number;
  interviews: Interview[];
}

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard, active: true, href: "/" },
  { label: "Interview", icon: Mic, active: false, href: "/interview" },
  { label: "Resume", icon: FileText, active: false, href: "/resume" },
  {
    label: "Performance",
    icon: ChartNoAxesCombined,
    active: false,
    href: "/performance",
  },
  { label: "History", icon: History, active: false, href: "/history" },
];

function Sidebar() {
  const router = useRouter();
  const user = getUser();

  function handleLogout() {
  clearSession();
  router.replace("/login");
}
  return (
    <aside className="sidebar">
      <a href="/" className="brand">
        <span className="brand-icon">
          <Sparkles size={23} />
        </span>
        <span>Interview<span className="brand-light">GPT</span></span>
      </a>

      <nav className="navigation">
        <p className="nav-heading">WORKSPACE</p>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <a
              key={item.label}
              href={item.href}
              className={`nav-link ${item.active ? "active" : ""}`}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.active && <span className="active-indicator" />}
            </a>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-promo">
          <div className="promo-icon">
            <Sparkles size={21} />
          </div>
          <h3>Improve with every interview.</h3>
          <p>Practice consistently and build confidence for your next opportunity.</p>
          <a href="/interview">
            Start practicing <ArrowRight size={15} />
          </a>
        </div>

        <div className="sidebar-profile">
          <div className="avatar">
           {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div>
         <p className="profile-name">
         {user?.name || "Your Account"}
         </p>
         <p className="profile-subtitle">
           {user?.email || "Logged in"}
         </p>
         </div>
         <button
         type="button"
         onClick={handleLogout}
         className="logout-button"
         >
         Logout
         </button>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace <ChevronRight size={14} /> <span>Dashboard</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="topbar-divider" />

        <div className="user-menu">
          <div className="avatar small">U</div>
          <span>User</span>
          <ChevronRight size={15} className="muted-icon" />
        </div>
      </div>
    </header>
  );
}

function WelcomeBanner() {
  return (
    <section className="welcome-section">
      <div>
        <p className="eyebrow">YOUR PERSONAL INTERVIEW WORKSPACE</p>
        <h1>Welcome back! <span className="wave">👋</span></h1>
        <p className="welcome-subtitle">
          Practice, review and improve, all in one place.
        </p>
      </div>
      <div className="welcome-date">
        <Clock3 size={15} />
        <span>Your interview journey starts here</span>
      </div>
    </section>
  );
}

function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-content">
        <div className="hero-label">
          <span className="live-dot" />
          AI-POWERED INTERVIEW PRACTICE
        </div>

        <h2>
          Ready for your
          <br />
          next interview?
        </h2>

        <p>
          Practice with an AI interviewer, answer real-world questions
          and get intelligent follow-up questions.
        </p>

        <a href="/interview" className="primary-button">
          <Mic size={18} />
          Start Interview
          <ArrowRight size={17} />
        </a>
      </div>

      <div className="hero-visual" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="hero-core">
          <Sparkles size={48} />
        </div>
        <div className="floating-card floating-card-top">
          <Mic size={17} />
          <span>Voice AI</span>
        </div>
        <div className="floating-card floating-card-bottom">
          <CheckCircle2 size={17} />
          <span>Smart follow-ups</span>
        </div>
        <div className="hero-glow" />
      </div>

      <div className="hero-decoration" />
    </section>
  );
}

function FeatureCards() {
  const features = [
    {
      title: "AI Interviews",
      description: "Practice with realistic voice-based interviews.",
      icon: Mic,
      color: "cyan",
      href: "/interview",
    },
    {
      title: "Resume Analysis",
      description: "Get insights to improve your resume.",
      icon: FileText,
      color: "blue",
      href: "/resume",
    },
    {
      title: "Track Performance",
      description: "Understand your progress over time.",
      icon: TrendingUp,
      color: "green",
      href: "/performance",
    },
  ];

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GET STARTED</p>
          <h2>Explore InterviewGPT</h2>
        </div>
      </div>

      <div className="feature-grid">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <a
              href={feature.href}
              key={feature.title}
              className="feature-card"
            >
              <div className={`feature-icon ${feature.color}`}>
                <Icon size={22} />
              </div>
              <div className="feature-copy">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <ArrowUpRight size={17} className="feature-arrow" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function RecentInterviews({
  interviews,
  loading,
  error,
}: {
  interviews: Interview[];
  loading: boolean;
  error: string;
}) {
  const router = useRouter();

  return (
    <section className="section-block">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR ACTIVITY</p>
          <h2>Recent Interviews</h2>
        </div>

        <a href="/history" className="text-link">
          View all <ArrowRight size={15} />
        </a>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="dashboard-state">
            Loading your recent interviews...
          </div>
        ) : error ? (
          <div className="dashboard-state error">
            {error}
          </div>
        ) : interviews.length === 0 ? (
          <div className="dashboard-state">
            <Mic size={25} />
            <p>You haven't taken any interviews yet.</p>
            <a href="/interview" className="text-link">
              Start your first interview <ArrowRight size={15} />
            </a>
          </div>
        ) : (
          <>
            <div className="interview-table table-header">
              <span>ROLE</span>
              <span>TYPE</span>
              <span>DATE</span>
              <span>RESULT</span>
              <span />
            </div>

            {interviews.slice(0, 5).map((interview) => {
              const completed = interview.status === "completed";
              const accuracy = interview.report?.accuracy;

              return (
                <div
                  className="interview-table interview-row"
                  key={interview._id}
                  onClick={() =>
                    router.push(
                      completed
                        ? `/interview/${interview._id}/report`
                        : `/interview/${interview._id}`
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      router.push(
                        completed
                          ? `/interview/${interview._id}/report`
                          : `/interview/${interview._id}`
                      );
                    }
                  }}
                >
                  <div className="role-cell">
                    <div className="role-icon">
                      <BriefcaseBusiness size={17} />
                    </div>
                    <span>{interview.role}</span>
                  </div>

                  <div>
                    <span className="type-badge">
                      {interview.interviewType}
                    </span>
                  </div>

                  <span className="date-cell">
                    {new Date(interview.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </span>

                  <div>
                    {completed ? (
                      <span className="result-badge success">
                        <CheckCircle2 size={13} />
                        {typeof accuracy === "number"
                          ? `${accuracy.toFixed(1)}%`
                          : "Completed"}
                      </span>
                    ) : (
                      <span className="result-badge">
                        <Clock3 size={13} />
                        {interview.status}
                      </span>
                    )}
                  </div>

                  <ChevronRight size={17} className="muted-icon" />
                </div>
              );
            })}

            <div className="table-footer">
              <span>
                Showing {Math.min(interviews.length, 5)} recent sessions
              </span>
              <a href="/history">
                Explore history <ArrowRight size={14} />
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ProgressCard({
  interviews,
  loading,
}: {
  interviews: Interview[];
  loading: boolean;
}) {
  const completed = interviews.filter(
    (interview) =>
      interview.status === "completed" && interview.report
  );

  const totalInterviews = interviews.length;

  const averageAccuracy =
    completed.length > 0
      ? completed.reduce(
          (sum, interview) => sum + (interview.report?.accuracy ?? 0),
          0
        ) / completed.length
      : 0;

  const totalCorrectAnswers = completed.reduce(
    (sum, interview) =>
      sum + (interview.report?.correctAnswers ?? 0),
    0
  );

  const averageScore = averageAccuracy / 10;

  return (
    <section className="panel progress-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR STATISTICS</p>
          <h2>Your Progress</h2>
        </div>
      </div>

      <p className="panel-description">
        Overall interview performance
      </p>

      {loading ? (
        <div className="dashboard-state">
          Loading your statistics...
        </div>
      ) : (
        <>
          <div className="progress-summary">
            <div className="progress-ring">
              <svg viewBox="0 0 120 120">
                <circle
                  className="ring-track"
                  cx="60"
                  cy="60"
                  r="49"
                />

                <circle
                  className="ring-value"
                  cx="60"
                  cy="60"
                  r="49"
                  style={{
                    strokeDasharray: `${(averageAccuracy / 100) * 308} 308`,
                  }}
                />
              </svg>

              <div className="ring-label">
                <strong>{averageAccuracy.toFixed(0)}%</strong>
                <span>Accuracy</span>
              </div>
            </div>

            <div className="score-summary">
              <span>Average score</span>

              <strong>
                {averageScore.toFixed(1)}
                <small> / 10</small>
              </strong>

              <small>Based on completed interviews</small>
            </div>
          </div>

          <div className="stat-list">
            <div className="stat-row">
              <div className="stat-icon cyan">
                <Mic size={17} />
              </div>
              <span>Total interviews</span>
              <strong>{totalInterviews}</strong>
            </div>

            <div className="stat-row">
              <div className="stat-icon green">
                <CheckCircle2 size={17} />
              </div>
              <span>Completed interviews</span>
              <strong>{completed.length}</strong>
            </div>

            <div className="stat-row">
              <div className="stat-icon blue">
                <TrendingUp size={17} />
              </div>
              <span>Correct answers</span>
              <strong>{totalCorrectAnswers}</strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function PerformanceChart({
  interviews,
  loading,
}: {
  interviews: Interview[];
  loading: boolean;
}) {
  const chartData = useMemo(() => {
    return interviews
      .filter(
        (interview) =>
          interview.status === "completed" &&
          typeof interview.report?.accuracy === "number"
      )
      .slice(0, 5)
      .reverse();
  }, [interviews]);

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR GROWTH</p>
          <h2>Performance Trend</h2>
        </div>

        <span className="chart-period">Last 5 sessions</span>
      </div>

      {loading ? (
        <div className="dashboard-state">
          Loading performance data...
        </div>
      ) : chartData.length === 0 ? (
        <div className="dashboard-state">
          Complete an interview to see your performance trend.
        </div>
      ) : (
        <div className="chart-container">
          <div className="chart-y-labels">
            <span>100%</span>
            <span>80%</span>
            <span>60%</span>
            <span>40%</span>
            <span>20%</span>
            <span>0%</span>
          </div>

          <div className="chart-main">
            <svg
              viewBox="0 0 340 190"
              preserveAspectRatio="none"
              className="chart-svg"
              role="img"
              aria-label="Performance across completed interviews"
            >
              {[10, 46, 82, 118, 154, 190].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="340"
                  y2={y}
                  stroke="#26364D"
                  strokeDasharray="4 5"
                />
              ))}

              {(() => {
                const points = chartData.map((item, index) => {
                  const x =
                    chartData.length === 1
                      ? 170
                      : 8 + (index * 322) / (chartData.length - 1);

                  const accuracy = item.report?.accuracy ?? 0;
                  const y = 190 - (accuracy / 100) * 180;

                  return { x, y };
                });

                const linePath = points
                  .map(
                    (point, index) =>
                      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                  )
                  .join(" ");

                return (
                  <>
                    {points.length > 1 && (
                      <path
                        d={`${linePath} L ${points[points.length - 1].x} 190 L ${points[0].x} 190 Z`}
                        fill="url(#chartFill)"
                      />
                    )}

                    <path
                      d={linePath}
                      fill="none"
                      stroke="#22D3EE"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {points.map((point, index) => (
                      <circle
                        key={chartData[index]._id}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#080F1F"
                        stroke="#22D3EE"
                        strokeWidth="3"
                      />
                    ))}
                  </>
                );
              })()}

              <defs>
                <linearGradient
                  id="chartFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22D3EE"
                    stopOpacity=".24"
                  />
                  <stop
                    offset="100%"
                    stopColor="#22D3EE"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
            </svg>

            <div className="chart-x-labels">
              {chartData.map((item, index) => (
                <span key={item._id}>
                  Session {index + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Dashboard() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setCheckingAuth(false);

    async function fetchInterviews() {
      try {
        setLoading(true);
        setError("");

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const response = await fetch(`${API_URL}/api/interviews`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load your interviews."
          );
        }

        const result = data as InterviewApiResponse;

        const sortedInterviews = [...result.interviews].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        );

        setInterviews(sortedInterviews);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading interviews."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchInterviews();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="interview-loading">
        <p>Checking your session...</p>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <Sidebar />

      <main className="dashboard-main">
        <Header />

        <div className="dashboard-content">
          <div className="main-column">
            <WelcomeBanner />
            <HeroBanner />
            <FeatureCards />

            <RecentInterviews
              interviews={interviews}
              loading={loading}
              error={error}
            />
          </div>

          <div className="right-column">
            <ProgressCard
              interviews={interviews}
              loading={loading}
            />

            <PerformanceChart
              interviews={interviews}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
