"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    if (!email) {
      setError("No email address found. Please sign up again.");
      return;
    }

    setResending(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Failed to resend verification email.");
    } finally {
      setResending(false);
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

        <div className="glass-card p-8 text-center">
          {sent ? (
            <>
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Email sent!</h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                We&apos;ve sent another verification email to <strong className="text-white">{email}</strong>
              </p>
            </>
          ) : (
            <>
              <Mail className="w-16 h-16 text-[var(--color-accent)] mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                We sent a verification link to <strong className="text-white">{email || "your email"}</strong>.
                Click the link to activate your account.
              </p>
            </>
          )}

          {error && (
            <div className="text-sm text-[var(--color-accent-rose)] bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mb-4"
          >
            {resending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Resend Verification Email
                <Mail className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
