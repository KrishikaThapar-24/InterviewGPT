
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSession, type AuthUser } from "@/lib/auth";
import { Sparkles, LoaderCircle } from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create account.");
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
      <form className="auth-card" onSubmit={handleSignup}>
        <div className="auth-brand">
          <Sparkles size={24} />
          <span>InterviewGPT</span>
        </div>

        <p className="auth-eyebrow">GET STARTED</p>
        <h1>Create your account</h1>
        <p className="auth-description">
          Start preparing for your next interview with AI.
        </p>

        <label htmlFor="name">Full name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />

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
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="spin" size={18} />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}
