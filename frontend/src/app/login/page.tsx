
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession, type AuthUser } from "@/lib/auth";
import { Sparkles, LoaderCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to log in.");
      }

      saveSession(data.token, data.user as AuthUser);
      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleLogin}>
        <div className="auth-brand">
          <Sparkles size={24} />
          <span>InterviewGPT</span>
        </div>

        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1>Log in to your account</h1>
        <p className="auth-description">
          Continue improving your interview skills.
        </p>

        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
