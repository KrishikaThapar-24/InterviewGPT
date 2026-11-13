 "use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, CheckCircle2, FileText, LoaderCircle,
  Sparkles, UploadCloud, X, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { authHeaders, clearSession, getToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type Analysis = Record<string, unknown>;
type GeneratedQuestion = {
  questionText: string;
  category?: string;
  difficulty?: string;
  relatedProject?: string;
  topic?: string;
};

function readable(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(readable).join(", ");
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${key.replace(/_/g, " ")}: ${readable(item)}`)
      .join(" · ");
  }
  return "";
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export default function ResumeInterviewPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState("Software Engineer");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [numberOfQuestions, setNumberOfQuestions] = useState("8");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [createdInterviewId, setCreatedInterviewId] = useState("");

  const analysisEntries = useMemo(() => {
    if (!analysis) return [];
    return Object.entries(analysis).filter(([, value]) => {
      if (value === null || value === undefined || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
  }, [analysis]);

  function validateFile(candidate: File): string {
    const extension = candidate.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(extension || "")) return "Please upload a PDF or DOCX file.";
    if (candidate.size === 0) return "The selected file is empty.";
    if (candidate.size > MAX_FILE_SIZE) return "File size must not exceed 5 MB.";
    return "";
  }

  function chooseFile(candidate?: File) {
    if (!candidate) return;
    const validationError = validateFile(candidate);
    setError(validationError);
    setAnalysis(null);
    setQuestions([]);
    setCreatedInterviewId("");
    setFile(validationError ? null : candidate);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Please select your resume before continuing.");
      return;
    }
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const form = new FormData();
    form.append("resume", file);
    form.append("role", role.trim());
    form.append("experienceLevel", experienceLevel);
    form.append("interviewType", interviewType);
    form.append("difficulty", difficulty);
    form.append("numberOfQuestions", numberOfQuestions);

    setLoading(true);
    setProgress(0);
    setAnalysis(null);
    setQuestions([]);
    setCreatedInterviewId("");

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${API_URL}/api/resumes/create-interview`);
        Object.entries(authHeaders()).forEach(([key, value]) => xhr.setRequestHeader(key, value));
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
        };
        xhr.onload = () => {
          let data: any = {};
          try { data = JSON.parse(xhr.responseText || "{}"); } catch { /* handled below */ }
          if (xhr.status === 401) {
            clearSession();
            router.replace("/login");
            reject(new Error("Your session has expired. Please log in again."));
          } else if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error(data.message || data.detail || "Unable to create the resume-based interview."));
          } else {
            resolve(data);
          }
        };
        xhr.onerror = () => reject(new Error("Network error. Check that the backend is running and try again."));
        xhr.onabort = () => reject(new Error("The upload was cancelled."));
        xhr.send(form);
      });

      const interview = result.interview;
      const interviewId = interview?._id || interview?.id;
      if (!interviewId) throw new Error("The server response did not include an interview ID.");
      const returnedAnalysis = result.resumeAnalysis || result.analysis;
      const returnedQuestions = interview.questions || result.questions || [];
      setAnalysis(returnedAnalysis && typeof returnedAnalysis === "object" ? returnedAnalysis : {});
      setQuestions(Array.isArray(returnedQuestions) ? returnedQuestions : []);
      setCreatedInterviewId(interviewId);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="resume-page">
      <header className="resume-topbar">
        <Link href="/" className="resume-back"><ArrowLeft size={17} /> Back to Dashboard</Link>
        <div className="resume-brand"><span><Sparkles size={19} /></span> InterviewGPT</div>
        <span className="resume-mode-label">RESUME-BASED MODE</span>
      </header>

      <div className="resume-container">
        <section className="resume-intro">
          <div className="resume-eyebrow"><Sparkles size={14} /> PERSONALIZED AI INTERVIEW</div>
          <h1>Let your resume lead the interview.</h1>
          <p>Upload your latest resume. InterviewGPT will analyze your experience and prepare questions around your projects, skills and background.</p>
        </section>

        <div className="resume-layout">
          <form className="resume-form" onSubmit={handleSubmit}>
            <div className="resume-section-heading">
              <div className="resume-heading-icon"><FileText size={19} /></div>
              <div><h2>Upload your resume</h2><p>PDF or DOCX · Maximum file size 5 MB</p></div>
            </div>

            <input ref={fileInput} className="resume-hidden-input" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => chooseFile(e.target.files?.[0])} />
            <div className={`resume-dropzone ${file ? "has-file" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files?.[0]); }}>
              {file ? (
                <div className="resume-file-row">
                  <div className="resume-file-icon"><FileText size={23} /></div>
                  <div className="resume-file-copy"><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</span></div>
                  <button type="button" className="resume-remove-file" aria-label="Remove resume" onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ""; }}><X size={17} /></button>
                </div>
              ) : (
                <>
                  <div className="resume-upload-icon"><UploadCloud size={27} /></div>
                  <strong>Drag and drop your resume here</strong>
                  <span>or</span>
                  <button type="button" className="resume-browse-button" onClick={() => fileInput.current?.click()}>Browse files</button>
                  <small>Only PDF and DOCX files up to 5 MB</small>
                </>
              )}
            </div>

            <div className="resume-form-divider" />
            <div className="resume-section-heading compact">
              <div className="resume-heading-icon"><Sparkles size={18} /></div>
              <div><h2>Interview preferences</h2><p>Set the role and interview format.</p></div>
            </div>

            <div className="resume-field">
              <label htmlFor="resume-role">Job role</label>
              <input id="resume-role" value={role} onChange={(e) => setRole(e.target.value)} minLength={2} maxLength={100} required placeholder="e.g. AI Engineer" />
            </div>

            <div className="resume-field">
              <label htmlFor="resume-experience">Experience level</label>
              <select id="resume-experience" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                {["Fresher", "Junior", "Mid-level", "Senior"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="resume-field">
              <label htmlFor="resume-type">Interview type</label>
              <select id="resume-type" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                {["Technical", "Behavioral", "Mixed"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div className="resume-two-fields">
              <div className="resume-field">
                <label htmlFor="resume-difficulty">Difficulty</label>
                <select id="resume-difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {["Easy", "Medium", "Hard"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div className="resume-field">
                <label htmlFor="resume-count">Number of questions</label>
                <select id="resume-count" value={numberOfQuestions} onChange={(e) => setNumberOfQuestions(e.target.value)}>
                  {[3, 5, 8, 10, 12, 15].map((item) => <option key={item} value={item}>{item} questions</option>)}
                </select>
              </div>
            </div>

            {error && <div className="resume-error" role="alert"><AlertCircle size={17} />{error}</div>}
            {loading && <div className="resume-progress-wrap"><div className="resume-progress-label"><span>Uploading and preparing your interview...</span><strong>{progress}%</strong></div><div className="resume-progress"><span style={{ width: `${Math.max(4, progress)}%` }} /></div><small>Resume analysis and question generation may take a little time. Please keep this page open.</small></div>}

            <button className="resume-submit" type="submit" disabled={loading || !file || !role.trim() || role.trim().length < 2}>
              {loading ? <><LoaderCircle size={18} className="spin" /> Processing resume...</> : <>Analyze resume & generate interview <ArrowRight size={18} /></>}
            </button>
            <p className="resume-privacy">Your original resume and extracted text are processed for this request and are not intended to be saved as files.</p>
          </form>

          <aside className="resume-info">
            <div className="resume-info-top"><div className="resume-info-icon"><Sparkles size={23} /></div><p className="resume-info-eyebrow">HOW IT WORKS</p><h2>An interview shaped by your actual experience.</h2><p>Questions are generated from the skills, projects and experience identified in your uploaded resume.</p></div>
            <div className="resume-info-step"><span>01</span><div><strong>Resume analysis</strong><p>Extract skills, projects and experience.</p></div></div>
            <div className="resume-info-step"><span>02</span><div><strong>Question generation</strong><p>Create role-specific questions at your chosen difficulty.</p></div></div>
            <div className="resume-info-step"><span>03</span><div><strong>Voice interview</strong><p>Continue in the same InterviewGPT interview room.</p></div></div>
            <div className="resume-info-note">Upload a fresh resume each time you start a resume-based interview.</div>
          </aside>
        </div>

        {analysis && (
          <section className="resume-results">
            <div className="resume-results-heading"><div><p className="resume-eyebrow">ANALYSIS COMPLETE</p><h2><CheckCircle2 size={22} /> Resume insights</h2></div><span>{questions.length} questions generated</span></div>
            <div className="resume-analysis-grid">
              {analysisEntries.length ? analysisEntries.map(([key, value]) => (
                <article className="resume-analysis-card" key={key}><h3>{titleCase(key)}</h3><p>{readable(value)}</p></article>
              )) : <article className="resume-analysis-card"><h3>Resume analyzed</h3><p>Your resume analysis completed successfully.</p></article>}
            </div>
            <div className="resume-questions">
              <h2>Generated interview questions</h2>
              {questions.length ? questions.map((question, index) => (
                <article className="resume-question" key={`${index}-${question.questionText}`}><span>QUESTION {String(index + 1).padStart(2, "0")}</span><p>{question.questionText}</p><div>{question.category && <small>{question.category}</small>}{question.difficulty && <small>{question.difficulty}</small>}{question.relatedProject && <small>{question.relatedProject}</small>}</div></article>
              )) : <p className="resume-no-questions">Interview created. Questions will be available in the interview room.</p>}
            </div>
            <button className="resume-submit resume-start-button" type="button" onClick={() => router.push(`/interview/${createdInterviewId}`)}>Start voice interview <ArrowRight size={18} /></button>
          </section>
        )}
      </div>
    </main>
  );
}
