
"use client";
import { authHeaders, getToken } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  Clock3,
  Code2,
  LoaderCircle,
  Mic,
  Sparkles,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InterviewSetupPage() {
  const router = useRouter();

  const [role, setRole] = useState("Python Developer");
  const [company, setCompany] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const token = getToken();

    if (!token) {
    router.replace("/login");
    return;
    }

    try {
      const response = await fetch(`${API_URL}/api/interviews`, {
        method: "POST",
        headers: {
       "Content-Type": "application/json",
        ...authHeaders(),
},
        body: JSON.stringify({
          role,
          company,
          experienceLevel,
          interviewType,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create your interview."
        );
      }

      const interviewId = data.interview?._id;

      if (!interviewId) {
        throw new Error("Interview was created, but its ID was not returned.");
      }

      router.push(`/interview/${interviewId}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="setup-page">
      <div className="setup-topbar">
        <a href="/" className="setup-back">
          <ArrowLeft size={17} />
          Back to Dashboard
        </a>

        <div className="setup-brand">
          <span><Sparkles size={19} /></span>
          InterviewGPT
        </div>
      </div>

      <div className="setup-container">
        <div className="setup-intro">
          <div className="setup-eyebrow">
            <Sparkles size={14} />
            PERSONALIZED AI INTERVIEW
          </div>

          <h1>Let's set up your interview.</h1>

          <p>
            Tell us a little about the role you're preparing for.
            We'll create an interview experience tailored to you.
          </p>
        </div>

        <div className="setup-layout">
          <form className="setup-form" onSubmit={handleSubmit}>
            <div className="form-section-heading">
              <div className="form-heading-icon">
                <BriefcaseBusiness size={19} />
              </div>
              <div>
                <h2>Interview details</h2>
                <p>Configure your interview preferences.</p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="role">Job role</label>
              <div className="input-with-icon">
                <Code2 size={17} />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option>Python Developer</option>
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>Full Stack Developer</option>
                  <option>AI Engineer</option>
                  <option>Machine Learning Engineer</option>
                  <option>Data Scientist</option>
                  <option>Software Engineer</option>
                  <option>Java Developer</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="company">
                Company name <span className="optional">(Optional)</span>
              </label>
              <div className="input-with-icon">
                <Building2 size={17} />
                <input
                  id="company"
                  type="text"
                  placeholder="e.g. Google, Microsoft, Amazon"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Experience level</label>
              <div className="option-grid four-columns">
                {["Fresher", "Junior", "Mid-level", "Senior"].map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={`option-button ${
                      experienceLevel === level ? "selected" : ""
                    }`}
                    onClick={() => setExperienceLevel(level)}
                  >
                    {experienceLevel === level && <Check size={13} />}
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Interview type</label>
              <div className="option-grid three-columns">
                {[
                  {
                    name: "Technical",
                    description: "Technical concepts and coding",
                  },
                  {
                    name: "Behavioral",
                    description: "Communication and experiences",
                  },
                  {
                    name: "Mixed",
                    description: "A combination of both",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    className={`type-option ${
                      interviewType === item.name ? "selected" : ""
                    }`}
                    onClick={() => setInterviewType(item.name)}
                  >
                    <span className="type-option-title">{item.name}</span>
                    <span className="type-option-description">
                      {item.description}
                    </span>
                    {interviewType === item.name && (
                      <span className="type-check"><Check size={12} /></span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Difficulty level</label>
              <div className="option-grid three-columns">
                {["Easy", "Medium", "Hard"].map((level) => (
                  <button
                    type="button"
                    key={level}
                    className={`option-button difficulty-option ${
                      difficulty === level ? "selected" : ""
                    }`}
                    onClick={() => setDifficulty(level)}
                  >
                    {difficulty === level && <Check size={13} />}
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="setup-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="create-interview-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Creating interview...
                </>
              ) : (
                <>
                  Create Interview
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="form-note">
              Your interview preferences will be saved securely.
            </p>
          </form>

          <aside className="setup-info">
            <div className="setup-info-top">
              <div className="info-sparkle"><Sparkles size={22} /></div>
              <p className="info-eyebrow">YOUR AI INTERVIEWER</p>
              <h2>A practice experience built around your goals.</h2>
              <p className="info-description">
                Your AI interviewer will adapt its questions to your
                selected role, experience and difficulty.
              </p>
            </div>

            <div className="info-divider" />

            <div className="info-feature">
              <div><Mic size={17} /></div>
              <section>
                <h3>Voice-based interaction</h3>
                <p>Have a natural interview conversation.</p>
              </section>
            </div>

            <div className="info-feature">
              <div><Sparkles size={17} /></div>
              <section>
                <h3>Intelligent follow-ups</h3>
                <p>Get relevant questions based on your answers.</p>
              </section>
            </div>

            <div className="info-feature">
              <div><Clock3 size={17} /></div>
              <section>
                <h3>Practice at your pace</h3>
                <p>Build confidence through consistent practice.</p>
              </section>
            </div>

            <div className="info-footer">
              <span className="live-dot" />
              Powered by InterviewGPT AI
            </div>
          </aside>
        </div>

        <p className="setup-bottom-note">
          <Sparkles size={13} />
          Every interview is an opportunity to improve.
        </p>
      </div>
    </main>
  );
}
