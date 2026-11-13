"use client";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authHeaders, clearSession, getToken } from "@/lib/auth";
import ProtectedPage from "@/components/auth/ProtectedPage";
import { ArrowLeft, CheckCircle2, FileText, Loader2, UploadCloud } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Analysis = {
  professional_summary?: string;
  skills?: string[];
  projects?: { name?: string; description?: string; technologies?: string[] }[];
  experience?: string[];
  education?: string[];
  strengths?: string[];
  improvement_areas?: string[];
};

function ResumeAnalysisContent() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setAnalysis(null);

    if (!file) {
      setError("Please select a PDF or DOCX resume.");
      return;
    }

    const ext = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(ext || "")) {
      setError("Only PDF and DOCX files are supported.");
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      setError("Choose a non-empty file smaller than 5 MB.");
      return;
    }

    const form = new FormData();
    form.append("resume", file);
    setBusy(true);

    try {
      const r = await fetch(`${API}/api/resumes/analyze`, {
        method: "POST",
        headers: authHeaders(),
        body: form,
      });

      if (r.status === 401) {
        clearSession();
        router.replace("/login");
        return;
      }

      const d = await r.json();
      if (!r.ok) throw new Error(d.message || d.detail || "Resume analysis failed.");
      setAnalysis(d.analysis as Analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze resume.");
    } finally {
      setBusy(false);
    }
  }

  const sections: [string, string[] | undefined][] = [
    ["Skills", analysis?.skills],
    ["Strengths", analysis?.strengths],
    ["Areas to improve", analysis?.improvement_areas],
    ["Experience", analysis?.experience],
    ["Education", analysis?.education],
  ];

  return (
    <main className="resume-analysis-page">
      <header className="analytics-header">
        <div>
          <Link href="/" className="analytics-back">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <p className="analytics-eyebrow">CAREER INSIGHTS</p>
          <h1>Resume Analysis</h1>
          <p>Understand your resume&apos;s skills, projects, strengths and improvement areas.</p>
        </div>
        <Link href="/resume" className="analytics-primary">
          Resume-based interview
        </Link>
      </header>

      <form className="resume-analysis-upload" onSubmit={submit}>
        <div className="resume-analysis-upload-icon">
          <UploadCloud size={28} />
        </div>
        <h2>Upload your resume</h2>
        <p>PDF or DOCX · Maximum 5 MB. Your original file and extracted text are not stored.</p>

        <label className="resume-file-picker">
          <FileText size={18} />
          <span>{file ? file.name : "Choose resume file"}</span>
          <input
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setAnalysis(null);
              setError("");
            }}
          />
        </label>

        {file && <small>{(file.size / 1024).toFixed(0)} KB</small>}
        {error && <p className="resume-analysis-error">{error}</p>}

        <button className="analytics-primary" disabled={busy} type="submit">
          {busy ? (
            <>
              <Loader2 className="spin" size={17} /> Analyzing...
            </>
          ) : (
            "Analyze resume"
          )}
        </button>
      </form>

      {analysis && (
        <section className="resume-analysis-results">
          <div className="resume-analysis-success">
            <CheckCircle2 /> Analysis completed successfully
          </div>

          <article className="analytics-panel">
            <h2>Professional summary</h2>
            <p>{analysis.professional_summary || "No summary was returned."}</p>
          </article>

          <div className="resume-analysis-grid">
            {sections.map(([title, values]) => (
              <article className="analytics-panel" key={title}>
                <h2>{title}</h2>
                {values?.length ? (
                  <ul>
                    {values.map((v, i) => (
                      <li key={`${title}-${i}`}>{v}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No {title.toLowerCase()} details identified.</p>
                )}
              </article>
            ))}
          </div>

          <article className="analytics-panel">
            <h2>Projects</h2>
            {analysis.projects?.length ? (
              analysis.projects.map((project, i) => (
                <div className="resume-project" key={i}>
                  <strong>{project.name || `Project ${i + 1}`}</strong>
                  <p>{project.description}</p>
                  {project.technologies?.length ? (
                    <div>{project.technologies.join(", ")}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <p>No projects identified.</p>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default function ResumeAnalysisPage() {
  return (
    <ProtectedPage>
      <ResumeAnalysisContent />
    </ProtectedPage>
  );
}
