"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, clearSession } from "@/lib/auth";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    setReady(true);
  }, [router]);
  if (!ready) return <main className="interview-loading"><p>Checking your session...</p></main>;
  return <>{children}</>;
}
