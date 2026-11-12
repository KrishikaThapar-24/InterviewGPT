
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { authHeaders, clearSession, getToken } from "@/lib/auth";
import Vapi from "@vapi-ai/web";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type InterviewQuestion = {
  _id: string;
  questionText: string;
  answer?: string;
  evaluation?: {
    isCorrect: boolean;
    followUpQuestion: string;
  } | null;
};

type InterviewData = {
  _id: string;
  role: string;
  company?: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  status: string;
  questions: InterviewQuestion[];
};

type ApiResponse = {
  message?: string;
  interview?: InterviewData;
  question?: InterviewQuestion;
  nextQuestion?: InterviewQuestion | null;
  isCorrect?: boolean;
  followUpQuestion?: string;
};

function InterviewRoomContent()  {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const interviewId = params.id;

  const vapiRef = useRef<Vapi | null>(null);
  const finalTranscriptRef = useRef("");

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);

  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState("");
  const [evaluation, setEvaluation] = useState<boolean | null>(null);
  const [followUpMessage, setFollowUpMessage] = useState("");

  
const request = useCallback(
  async (
    path: string,
    options?: RequestInit
  ): Promise<ApiResponse> => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      throw new Error("Please log in to continue.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
        ...options?.headers,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401) {
      clearSession();
      router.replace("/login");
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data as ApiResponse;
  },
  [router]
);


  const loadInterview = useCallback(async () => {
    try {
      setError("");

      const data = await request(`/api/interviews/${interviewId}`);
      const loadedInterview = data.interview;

      if (!loadedInterview) {
        throw new Error("Interview details could not be loaded.");
      }

      setInterview(loadedInterview);

      const questions = loadedInterview.questions || [];
      const unansweredQuestion = questions.find(
        (question) => !question.answer?.trim()
      );

      if (unansweredQuestion) {
        setCurrentQuestion(unansweredQuestion);
      } else {
        await generateFirstQuestion();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load interview."
      );
    } finally {
      setIsLoading(false);
    }
  }, [interviewId, request]);

  const generateFirstQuestion = async () => {
    try {
      setIsGenerating(true);

      const data = await request(
        `/api/interviews/${interviewId}/questions/generate`,
        {
          method: "POST",
          body: JSON.stringify({ topic: "General" }),
        }
      );

      if (!data.question) {
        throw new Error("The AI did not return a question.");
      }

      setCurrentQuestion(data.question);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to generate a question."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    void loadInterview();
  }, [loadInterview]);

  // Set up Vapi and listen for call and transcript events.
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      setError("Vapi public key is missing from frontend/.env.local.");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setIsCallActive(true);
      setError("");
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsAssistantSpeaking(false);
    });

    vapi.on("speech-start", () => {
      setIsAssistantSpeaking(true);
    });

    vapi.on("speech-end", () => {
      setIsAssistantSpeaking(false);
    });

    vapi.on("message", (message: any) => {
      if (
        message.type === "transcript" &&
        message.role === "user" &&
        message.transcriptType === "final"
      ) {
        const newTranscript = String(message.transcript || "").trim();

        if (newTranscript) {
          finalTranscriptRef.current = [
            finalTranscriptRef.current,
            newTranscript,
          ]
            .filter(Boolean)
            .join(" ");

          setTranscript(finalTranscriptRef.current);
        }
      }
    });

    vapi.on("error", (event: any) => {
      console.error("Vapi error:", event);
      setError(
        event?.message ||
          "Voice connection failed. Check your Vapi configuration and microphone permission."
      );
      setIsCallActive(false);
    });

    return () => {
      vapi.stop();
      vapiRef.current = null;
    };
  }, []);

  const startVoiceCall = async () => {
    const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

    if (!assistantId || !vapiRef.current) {
      setError("Vapi Assistant ID or public key is missing.");
      return;
    }

    if (!currentQuestion) {
      setError("Please wait until a question is displayed.");
      return;
    }

    try {
      setError("");
      setTranscript("");
      finalTranscriptRef.current = "";

      await vapiRef.current.start(assistantId, {
        variableValues: {
          question: currentQuestion.questionText,
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not start the voice interview."
      );
    }
  };

  const stopVoiceCall = () => {
    vapiRef.current?.stop();
    setIsCallActive(false);
  };

  const submitAnswer = async () => {
    if (!currentQuestion) return;

    const finalAnswer = (answer.trim() || transcript.trim()).trim();

    if (!finalAnswer) {
      setError("Please speak or type your answer before submitting.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setEvaluation(null);
      setFollowUpMessage("");

      if (isCallActive) {
        vapiRef.current?.stop();
        setIsCallActive(false);
      }

      await request(
        `/api/interviews/${interviewId}/questions/${currentQuestion._id}/answer`,
        {
          method: "PATCH",
          body: JSON.stringify({ answer: finalAnswer }),
        }
      );

      setAnswer(finalAnswer);
      setTranscript(finalAnswer);

      setIsEvaluating(true);

      const result = await request(
        `/api/interviews/${interviewId}/questions/${currentQuestion._id}/evaluate`,
        { method: "POST" }
      );

      if (typeof result.isCorrect !== "boolean") {
        throw new Error("The AI returned an invalid evaluation.");
      }

      setEvaluation(result.isCorrect);
      setFollowUpMessage(
        result.followUpQuestion ||
          result.nextQuestion?.questionText ||
          "Your answer has been evaluated."
      );

      if (result.nextQuestion) {
        setCurrentQuestion(result.nextQuestion);

        setInterview((previous) =>
          previous
            ? {
                ...previous,
                questions: [
                  ...previous.questions,
                  result.nextQuestion!,
                ],
              }
            : previous
        );
      }

      setAnswer("");
      setTranscript("");
      finalTranscriptRef.current = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your answer."
      );
    } finally {
      setIsSaving(false);
      setIsEvaluating(false);
    }
  };

  const endInterview = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to end this interview?"
    );

    if (!confirmed) return;

    try {
      setIsEnding(true);
      setError("");

      if (isCallActive) {
        vapiRef.current?.stop();
        setIsCallActive(false);
      }

      await request(`/api/interviews/${interviewId}/complete`, {
        method: "POST",
      });

      router.push(`/interview/${interviewId}/report`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to end the interview."
      );
    } finally {
      setIsEnding(false);
    }
  };

  if (isLoading) {
    return (
      <main className="interview-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Preparing your interview...</p>
      </main>
    );
  }

  if (error && !interview) {
    return (
      <main className="interview-loading">
        <CircleAlert size={32} />
        <p>{error}</p>
        <button onClick={() => router.push("/")}>Back to dashboard</button>
      </main>
    );
  }

  return (
    <main className="room-page">
      <header className="room-header">
        <button
          className="room-back"
          onClick={() => router.push("/")}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="room-brand">
          <div className="room-brand-icon">
            <Sparkles size={19} />
          </div>
          <span>InterviewGPT</span>
        </div>

        <div className="room-header-right">
          <span className="room-live-dot" />
          <span>Interview in progress</span>
        </div>
      </header>

      <section className="room-container">
        <div className="room-title-section">
          <div>
            <p className="room-eyebrow">YOUR INTERVIEW SESSION</p>
            <h1>{interview?.role} Interview</h1>
            <p className="room-subtitle">
              {interview?.company || "Practice Interview"} ·{" "}
              {interview?.experienceLevel} · {interview?.interviewType}
            </p>
          </div>

          <button
            className="room-end-button"
            onClick={endInterview}
            disabled={isEnding}
          >
            {isEnding ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <PhoneOff size={17} />
            )}
            End Interview
          </button>
        </div>

        <div className="room-layout">
          <section className="room-main-card">
            <div className="room-card-top">
              <div className="room-question-label">
                <Sparkles size={17} />
                AI INTERVIEWER
              </div>
              <span className="room-difficulty">
                {interview?.difficulty || "Medium"}
              </span>
            </div>

            <div className="room-question-content">
              <p className="room-small-label">CURRENT QUESTION</p>

              {isGenerating ? (
                <div className="room-generating">
                  <Loader2 size={25} className="animate-spin" />
                  <p>Generating your first question...</p>
                </div>
              ) : (
                <h2>
                  {currentQuestion?.questionText ||
                    "No question is currently available."}
                </h2>
              )}
            </div>

            <div className="room-divider" />

            <div className="room-voice-section">
              <div className="room-voice-heading">
                <div>
                  <h3>Voice Interview</h3>
                  <p>Speak naturally. Your answer will be transcribed.</p>
                </div>
                <Volume2 size={20} />
              </div>

              <div className="room-mic-area">
                <div
                  className={`room-mic-orbit ${
                    isCallActive ? "room-mic-active" : ""
                  }`}
                >
                  <button
                    className="room-mic-button"
                    onClick={
                      isCallActive ? stopVoiceCall : startVoiceCall
                    }
                    disabled={!currentQuestion || isSaving || isEvaluating}
                    aria-label={
                      isCallActive ? "Stop voice call" : "Start voice call"
                    }
                  >
                    {isCallActive ? (
                      <MicOff size={30} />
                    ) : (
                      <Mic size={30} />
                    )}
                  </button>
                </div>

                <p className="room-mic-status">
                  {isCallActive
                    ? isAssistantSpeaking
                      ? "AI interviewer is speaking..."
                      : "Listening to your answer..."
                    : "Click the microphone to start speaking"}
                </p>

                {isCallActive && (
                  <button
                    className="room-stop-call"
                    onClick={stopVoiceCall}
                  >
                    <PhoneOff size={15} />
                    Stop recording
                  </button>
                )}
              </div>

              <div className="room-transcript">
                <div className="room-transcript-heading">
                  <span>YOUR ANSWER / TRANSCRIPT</span>
                  <span className="room-transcript-indicator">
                    {transcript ? "Transcript captured" : "Waiting for answer"}
                  </span>
                </div>

                <textarea
                  value={answer || transcript}
                  onChange={(event) => setAnswer(event.target.value)}
                  placeholder="Your spoken answer will appear here. You can also type your answer..."
                  rows={5}
                  disabled={isSaving || isEvaluating}
                />

                <button
                  className="room-submit-button"
                  onClick={submitAnswer}
                  disabled={
                    isSaving ||
                    isEvaluating ||
                    (!answer.trim() && !transcript.trim()) ||
                    !currentQuestion
                  }
                >
                  {isSaving || isEvaluating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {isSaving ? "Saving answer..." : "Evaluating answer..."}
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>

            {evaluation !== null && (
              <div
                className={`room-result ${
                  evaluation ? "room-result-correct" : "room-result-incorrect"
                }`}
              >
                {evaluation ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <CircleAlert size={22} />
                )}

                <div>
                  <strong>
                    {evaluation ? "Correct answer!" : "Incorrect answer"}
                  </strong>
                  <p>
                    {evaluation
                      ? "Good job. Let's explore the concept further."
                      : "Let's clarify this concept with another question."}
                  </p>
                </div>
              </div>
            )}

            {followUpMessage && (
              <div className="room-followup">
                <span>FOLLOW-UP</span>
                <p>{followUpMessage}</p>
              </div>
            )}

            {error && (
              <div className="room-error">
                <CircleAlert size={17} />
                {error}
              </div>
            )}
          </section>

          <aside className="room-sidebar">
            <div className="room-side-card">
              <h3>Interview Details</h3>

              <div className="room-detail-row">
                <span>Role</span>
                <strong>{interview?.role}</strong>
              </div>

              <div className="room-detail-row">
                <span>Experience</span>
                <strong>{interview?.experienceLevel}</strong>
              </div>

              <div className="room-detail-row">
                <span>Interview type</span>
                <strong>{interview?.interviewType}</strong>
              </div>

              <div className="room-detail-row">
                <span>Difficulty</span>
                <strong>{interview?.difficulty}</strong>
              </div>
            </div>

            <div className="room-side-card room-tips-card">
              <div className="room-tips-icon">
                <Mic size={20} />
              </div>
              <h3>Interview Tips</h3>
              <ul>
                <li>Speak clearly and at a natural pace.</li>
                <li>Explain your reasoning, not just the result.</li>
                <li>Use examples wherever possible.</li>
                <li>You can type your answer if your microphone is unavailable.</li>
              </ul>
            </div>

            <div className="room-side-card room-progress-card">
              <h3>Session Progress</h3>
              <div className="room-progress-number">
                {interview?.questions?.filter((question) =>
                  question.answer?.trim()
                ).length || 0}
                <span> answers submitted</span>
              </div>
              <p>Questions and follow-ups are generated dynamically.</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
export default function InterviewRoom() {
  return (
    <Suspense
      fallback={
        <main className="interview-loading">
          <Loader2 className="animate-spin" size={32} />
          <p>Preparing your interview...</p>
        </main>
      }
    >
      <InterviewRoomContent />
    </Suspense>
  );
}