"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Zap,
  Bot,
  MessageCircle,
  Phone,
  Package,
  ArrowRight,
  Check,
  BarChart3,
  Shield,
  ChevronRight,
  Globe,
  Lock,
  Cpu,
} from "lucide-react";

/* ============================================ */
/* Animations                                    */
/* ============================================ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

/* ============================================ */
/* Data                                          */
/* ============================================ */
const agents = [
  {
    icon: Package,
    name: "Inventory Optimizer",
    tag: "Agent 01",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
    description:
      "Connects to your Shopify store and scans your entire product catalog every morning. If any SKU is heading toward a stockout based on your defined threshold, it drafts a vendor Purchase Order automatically.",
    how: "Powered by Shopify Admin API + OpenAI, running on a daily Inngest Cron job.",
    features: [
      "Daily automated stock level analysis",
      "Configurable low-stock threshold alerts",
      "AI-drafted Purchase Order emails for vendors",
      "Works on your own Shopify + OpenAI API keys",
    ],
  },
  {
    icon: MessageCircle,
    name: "WhatsApp Nudge",
    tag: "Agent 02",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.1)",
    border: "rgba(124,58,237,0.2)",
    description:
      "When a customer abandons their cart, this agent waits for a delay you define, generates a personalised WhatsApp message using your store's data, and sends it via Twilio. Customers can reply and the agent handles the conversation.",
    how: "Powered by Twilio WhatsApp API + OpenAI GPT-4o-mini, triggered by Shopify checkout webhooks.",
    features: [
      "Triggered by real Shopify abandoned checkout events",
      "Personalised message using customer name & cart items",
      "Two-way conversation handling via TwiML",
      "Configurable delay before sending (in minutes)",
    ],
  },
  {
    icon: Phone,
    name: "Voice Closer",
    tag: "Agent 03",
    color: "#2563eb",
    bg: "rgba(37,99,235,0.1)",
    border: "rgba(37,99,235,0.2)",
    description:
      "Triggers an AI phone call to a customer who abandoned a high-value cart. Uses Bland.ai to place the call with a persona and script you define in the dashboard. No human needed.",
    how: "Powered by Bland.ai Voice API, triggered by Shopify checkout webhooks via Inngest queue.",
    features: [
      "Outbound AI voice call on cart abandonment",
      "Fully configurable voice persona and script",
      "Built-in 15-minute call delay by default",
      "Uses your own Bland.ai API key securely",
    ],
  },
];

const plans = [
  {
    name: "Starter",
    price: 499,
    description: "One agent for stores just getting started with automation",
    features: [
      "1 AI Agent of your choice",
      "Connect your own API keys",
      "Up to 500 events/month",
      "Basic analytics dashboard",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: 699,
    description: "All three agents working together on one platform",
    features: [
      "All 3 AI Agents",
      "Connect your own API keys",
      "Up to 5,000 events/month",
      "Full analytics & event logs",
      "WhatsApp + email support",
      "Priority Inngest queue",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Scale",
    price: 999,
    description: "For high-volume stores that need maximum throughput",
    features: [
      "All 3 AI Agents",
      "Unlimited events/month",
      "Custom agent configurations",
      "Dedicated onboarding call",
      "Multi-store support",
      "Custom API integrations",
    ],
    cta: "Contact Us",
    popular: false,
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Connect Your Store",
    desc: "Link your Shopify store and add your own API keys (OpenAI, Twilio, Bland.ai). Your keys stay encrypted and never leave your account.",
    icon: Globe,
  },
  {
    step: "02",
    title: "Configure Your Agents",
    desc: "Set thresholds, delays, personas, and prompts for each agent from your dashboard. You stay in full control of how each agent behaves.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "Agents Run Automatically",
    desc: "Shopify fires webhooks to StorePilot on cart abandonment. Agents wake up, fetch your config, and take action — voice call, WhatsApp message, or inventory report.",
    icon: Bot,
  },
];

const techStack = [
  "Shopify Admin API",
  "OpenAI GPT-4o-mini",
  "Twilio WhatsApp",
  "Bland.ai Voice",
  "Inngest Queue",
  "Supabase (Auth + DB)",
  "Razorpay Billing",
  "AES-256 Encryption",
];

/* ============================================ */
/* Component                                     */
/* ============================================ */
export default function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ───── Navbar ───── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[rgba(5,5,16,0.9)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              StorePilot
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#agents" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              Agents
            </a>
            <a href="#pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              Pricing
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors px-4 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white gradient-bg px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.08)] text-sm font-medium text-[#c4b5fd] mb-8"
          >
            <Bot className="w-4 h-4" />
            <span>3 Shopify AI Agents — Built and deployed</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-6xl font-black tracking-tight leading-[1.08] mb-6"
          >
            Automate the work that
            <br />
            <span className="gradient-text">costs you revenue every day</span>
          </motion.h1>

          {/* Subtitle — honest, specific */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            StorePilot connects 3 specialized AI agents to your Shopify store — recovering abandoned carts via WhatsApp and voice calls, and alerting you when inventory goes critical. You bring your API keys. We handle the orchestration.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link
              href="/signup"
              className="group flex items-center gap-2 gradient-bg text-white font-semibold px-8 py-3.5 rounded-xl text-base hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium px-8 py-3.5 rounded-xl border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Honest trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-text-muted)]"
          >
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Your API keys encrypted with AES-256</span>
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> No credit card for trial</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Setup in under 5 minutes</span>
          </motion.div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[rgba(124,58,237,0.07)] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[rgba(6,182,212,0.05)] rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-black tracking-tight mb-4"
            >
              How StorePilot works
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            >
              No black boxes. Here is exactly what happens from setup to your agents running.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6"
              >
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-bold text-[var(--color-accent)] mb-1 uppercase tracking-wider">Step {step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── AI Agents Section ───── */}
      <section id="agents" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] text-sm font-medium text-[#6ee7b7] mb-4"
            >
              <Bot className="w-4 h-4" />
              The Three Agents
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-4xl font-black tracking-tight mb-4"
            >
              What each agent actually does
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            >
              Each agent is purpose-built for one job. No bloat, no vague promises.
            </motion.p>
          </motion.div>

          {/* Agent Tabs */}
          <div className="flex gap-3 justify-center mb-10 flex-wrap">
            {agents.map((a, i) => (
              <button
                key={i}
                onClick={() => setActiveAgent(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeAgent === i
                    ? "text-white shadow-lg"
                    : "text-[var(--color-text-secondary)] border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.04)]"
                }`}
                style={
                  activeAgent === i
                    ? { backgroundColor: a.bg, borderColor: a.border, color: a.color, border: `1px solid ${a.border}` }
                    : undefined
                }
              >
                <a.icon className="w-4 h-4" />
                {a.name}
              </button>
            ))}
          </div>

          {/* Active Agent Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAgent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="glass-card p-8 md:p-10"
            >
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left */}
                <div>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold mb-4"
                    style={{
                      backgroundColor: agents[activeAgent].bg,
                      color: agents[activeAgent].color,
                    }}
                  >
                    {agents[activeAgent].tag}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">
                    {agents[activeAgent].name}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
                    {agents[activeAgent].description}
                  </p>

                  {/* Tech transparency */}
                  <div className="mb-6 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)]">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      <span className="font-semibold text-white">Under the hood:</span>{" "}
                      {agents[activeAgent].how}
                    </p>
                  </div>

                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 gradient-bg text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Set Up {agents[activeAgent].name}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Right — Features */}
                <div className="space-y-3">
                  {agents[activeAgent].features.map((f, i) => (
                    <motion.div
                      key={`${activeAgent}-${i}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.04)]"
                    >
                      <Check
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: agents[activeAgent].color }}
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {f}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ───── Tech Stack ───── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-sm text-[var(--color-text-muted)] mb-6 uppercase tracking-wider font-semibold"
          >
            Built on real infrastructure
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {techStack.map((tech, i) => (
              <span
                key={i}
                className="text-sm text-[var(--color-text-secondary)] border border-[var(--color-border-glass)] px-4 py-1.5 rounded-full bg-[rgba(255,255,255,0.02)]"
              >
                {tech}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───── Pricing Section ───── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(245,158,11,0.3)] bg-[rgba(245,158,11,0.08)] text-sm font-medium text-[#fbbf24] mb-4"
            >
              <BarChart3 className="w-4 h-4" />
              Pricing
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-4xl font-black tracking-tight mb-4"
            >
              Straightforward pricing.{" "}
              <span className="gradient-text">No surprises.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            >
              14-day free trial. No credit card required. Cancel anytime —
              your data and API keys can be exported at any time.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                className={`relative overflow-hidden rounded-2xl p-8 ${
                  plan.popular
                    ? "border-gradient bg-[rgba(124,58,237,0.06)]"
                    : "glass-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-4 right-4 text-xs font-bold text-[#c4b5fd] bg-[rgba(124,58,237,0.2)] px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">₹{plan.price}</span>
                    <span className="text-[var(--color-text-muted)] text-sm">
                      /month
                    </span>
                  </div>
                </div>

                <Link
                  href="/signup"
                  className={`block text-center font-semibold py-3 rounded-xl mb-6 transition-all ${
                    plan.popular
                      ? "gradient-bg text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                      : "bg-[rgba(255,255,255,0.06)] text-white border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.1)]"
                  }`}
                >
                  {plan.cta}
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]"
                    >
                      <Check className="w-4 h-4 text-[var(--color-accent-green)] flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Section ───── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="relative overflow-hidden rounded-3xl p-12 md:p-16 text-center border-gradient"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.1)] to-[rgba(6,182,212,0.05)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Start automating your store today
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
                Set up in minutes. Connect Shopify, add your API keys, configure
                your agents, and let them run. No hidden fees. No lock-in.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 gradient-bg text-white font-semibold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> No credit card required · Your API keys stay encrypted
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-[var(--color-border-glass)] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold">StorePilot</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="/login" className="hover:text-white transition-colors">
                Log In
              </a>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              © 2026 StorePilot
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
