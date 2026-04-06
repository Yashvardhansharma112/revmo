"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link");
        return;
      }

      // Always show success to prevent email enumeration
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-[rgba(124,58,237,0.08)] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold">StorePilot</span>
        </Link>

        <div className="glass-card p-8">
          {sent ? (
            <>
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-center mb-2">Check your inbox</h1>
              <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
                If an account exists with <strong className="text-white">{email}</strong>, we&apos;ve sent a password reset link.
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.04)] transition text-sm font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center mb-2">Reset your password</h1>
              <p className="text-sm text-[var(--color-text-muted)] text-center mb-8">
                Enter your email and we&apos;ll send you a reset link
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="text-sm text-[var(--color-accent-rose)] bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--color-border-glass)] text-sm outline-none focus:border-[var(--color-accent)] transition placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
