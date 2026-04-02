"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const plans = [
  { id: "starter", name: "Starter", price: 499, agents: "1 Agent" },
  { id: "growth", name: "Growth", price: 699, agents: "3 Agents", popular: true },
  { id: "scale", name: "Scale", price: 999, agents: "Unlimited" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState("growth");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Excellent"][passwordStrength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#f59e0b", "#10b981", "#06b6d4"][passwordStrength];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            plan: selectedPlan,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative">
      <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-[rgba(124,58,237,0.08)] rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold">StorePilot</span>
        </Link>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s
                    ? "gradient-bg text-white"
                    : "bg-[rgba(255,255,255,0.06)] text-[var(--color-text-muted)]"
                }`}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 rounded ${
                    step > 1 ? "gradient-bg" : "bg-[rgba(255,255,255,0.1)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card p-8">
          {step === 1 ? (
            /* ──────── Step 1: Choose Plan ──────── */
            <>
              <h1 className="text-2xl font-bold text-center mb-2">
                Choose your plan
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
                14-day free trial on all plans. Cancel anytime.
              </p>

              <div className="space-y-3 mb-6">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedPlan === p.id
                        ? "border-[var(--color-accent)] bg-[rgba(124,58,237,0.08)]"
                        : "border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.03)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedPlan === p.id
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                            : "border-[var(--color-text-muted)]"
                        }`}
                      >
                        {selectedPlan === p.id && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{p.name}</span>
                          {p.popular && (
                            <span className="text-[10px] font-bold text-[#c4b5fd] bg-[rgba(124,58,237,0.2)] px-2 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {p.agents}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">₹{p.price}</span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        /mo
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* ──────── Step 2: Create Account ──────── */
            <>
              <h1 className="text-2xl font-bold text-center mb-2">
                Create your account
              </h1>
              <p className="text-sm text-[var(--color-text-muted)] text-center mb-6">
                {plans.find((p) => p.id === selectedPlan)?.name} plan · ₹
                {plans.find((p) => p.id === selectedPlan)?.price}/mo
              </p>

              <button
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-[var(--color-border-glass)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] transition text-sm font-medium cursor-pointer mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-[var(--color-border-glass)]" />
                <span className="text-xs text-[var(--color-text-muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--color-border-glass)]" />
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {error && (
                  <div className="text-sm text-[var(--color-accent-rose)] bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--color-border-glass)] text-sm outline-none focus:border-[var(--color-accent)] transition placeholder:text-[var(--color-text-muted)]"
                    />
                  </div>
                </div>

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

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 12 characters"
                      required
                      minLength={12}
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--color-border-glass)] text-sm outline-none focus:border-[var(--color-accent)] transition placeholder:text-[var(--color-text-muted)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(passwordStrength / 5) * 100}%`,
                            backgroundColor: strengthColor,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || passwordStrength < 3}
                  className="w-full gradient-bg text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-[var(--color-text-muted)] mt-4 hover:text-white transition cursor-pointer"
              >
                ← Change plan
              </button>
            </>
          )}
        </div>

        <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
