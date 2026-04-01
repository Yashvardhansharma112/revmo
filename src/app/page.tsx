"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Bot,
  TrendingUp,
  MessageCircle,
  Phone,
  Package,
  ArrowRight,
  Check,
  Star,
  BarChart3,
  Shield,
  ChevronRight,
  Sparkles,
  Globe,
  Clock,
} from "lucide-react";

/* ============================================ */
/* Animations                                    */
/* ============================================ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
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
      "AI-powered demand forecasting, automatic reordering, and stock optimization. Never overstock or go out-of-stock again.",
    stats: [
      { label: "Stock Accuracy", value: "98.5%" },
      { label: "Avg Savings", value: "₹45K/mo" },
    ],
    features: [
      "Demand forecasting with 95%+ accuracy",
      "Automated purchase orders & reorder alerts",
      "Seasonal trend detection & planning",
      "Dead stock identification & liquidation",
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
      "Recover abandoned carts, send personalized offers, and nurture customers — all through AI-powered WhatsApp conversations.",
    stats: [
      { label: "Cart Recovery", value: "32%" },
      { label: "Open Rate", value: "94%" },
    ],
    features: [
      "Abandoned cart recovery with smart nudges",
      "Personalized product recommendations",
      "Sentiment analysis & escalation",
      "Multi-language support (Hindi, English, Regional)",
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
      "AI voice agent that qualifies leads, follows up on high-value orders, and closes deals with natural-sounding conversations.",
    stats: [
      { label: "Close Rate", value: "28%" },
      { label: "Calls/Day", value: "500+" },
    ],
    features: [
      "Natural voice AI with emotional intelligence",
      "Lead qualification & priority scoring",
      "Follow-up scheduling & CRM sync",
      "Call recording & sentiment analytics",
    ],
  },
];

const plans = [
  {
    name: "Starter",
    price: 499,
    description: "Perfect for new D2C brands starting their automation journey",
    features: [
      "1 AI Agent (choose any)",
      "Up to 500 orders/month",
      "Basic analytics dashboard",
      "Email support",
      "1 team member",
      "Shopify OR WooCommerce",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: 699,
    description: "For scaling brands that need all three AI agents working together",
    features: [
      "All 3 AI Agents",
      "Up to 5,000 orders/month",
      "Advanced analytics & reports",
      "WhatsApp + Email support",
      "5 team members",
      "Priority API access",
      "Custom automations",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    price: 999,
    description: "Enterprise-grade for high-volume D2C operations",
    features: [
      "All 3 AI Agents + Custom agents",
      "Unlimited orders",
      "AI-powered reports & forecasting",
      "Dedicated account manager",
      "Unlimited team members",
      "Multi-store support",
      "Custom integrations & API",
      "SOC 2 compliance",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const metrics = [
  { value: "2,400+", label: "Active Stores", icon: Globe },
  { value: "₹12Cr+", label: "Revenue Recovered", icon: TrendingUp },
  { value: "94%", label: "Customer Retention", icon: Star },
  { value: "< 2min", label: "Setup Time", icon: Clock },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Founder, EthnicWeave",
    text: "Revmo's WhatsApp agent recovered ₹4.2L in abandoned carts in just the first month. It's like having a 24/7 sales team.",
    avatar: "PS",
    rating: 5,
  },
  {
    name: "Rajesh Kannan",
    role: "CEO, FreshBasket",
    text: "The Inventory Optimizer cut our wastage by 40%. We never overstock perishables anymore. Absolute game-changer.",
    avatar: "RK",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "Head of Growth, UrbanCraft",
    text: "Voice Closer handles 500+ calls daily. Our close rate jumped from 8% to 28% in two months. Insane ROI.",
    avatar: "AP",
    rating: 5,
  },
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
              Revmo
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#agents" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              Agents
            </a>
            <a href="#pricing" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm text-[var(--color-text-secondary)] hover:text-white transition-colors">
              Testimonials
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
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[rgba(124,58,237,0.3)] bg-[rgba(124,58,237,0.08)] text-sm font-medium text-[#c4b5fd] mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>3 AI Agents. Zero Manual Work.</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
          >
            AI Agents That
            <br />
            <span className="gradient-text">Sell For You</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Revmo deploys 3 specialized AI agents to your Shopify or WooCommerce
            store — optimizing inventory, nudging customers on WhatsApp, and
            closing deals by voice.{" "}
            <span className="text-white font-medium">All on autopilot.</span>
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
              Start Free — 14 Days
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#agents"
              className="flex items-center gap-2 text-[var(--color-text-secondary)] font-medium px-8 py-3.5 rounded-xl border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              See How It Works
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Trust Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {metrics.map((m, i) => (
              <div
                key={i}
                className="glass-card px-4 py-3.5 flex flex-col items-center gap-1"
              >
                <m.icon className="w-4 h-4 text-[var(--color-accent)] mb-1" />
                <span className="text-xl font-bold">{m.value}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {m.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Decorative orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[rgba(124,58,237,0.08)] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[rgba(6,182,212,0.06)] rounded-full blur-[100px] pointer-events-none" />
      </section>

      {/* ───── AI Agents Section ───── */}
      <section id="agents" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
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
              Meet Your AI Team
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            >
              3 Agents. 1 Platform.{" "}
              <span className="gradient-text">Infinite Growth.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            >
              Each agent is specialized in one critical aspect of your ecommerce
              operations and works 24/7.
            </motion.p>
          </motion.div>

          {/* Agent Tabs */}
          <div className="flex gap-3 justify-center mb-12">
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
                <span className="hidden sm:inline">{a.name}</span>
                <span className="sm:hidden">{a.tag}</span>
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
              transition={{ duration: 0.4 }}
              className="glass-card p-8 md:p-12"
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
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    {agents[activeAgent].name}
                  </h3>
                  <p className="text-[var(--color-text-secondary)] mb-6 leading-relaxed">
                    {agents[activeAgent].description}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-6 mb-8">
                    {agents[activeAgent].stats.map((s, i) => (
                      <div key={i}>
                        <div
                          className="text-2xl font-black"
                          style={{ color: agents[activeAgent].color }}
                        >
                          {s.value}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)]">
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 gradient-bg text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition"
                  >
                    Activate {agents[activeAgent].name}
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
                      transition={{ delay: i * 0.1 }}
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

      {/* ───── Pricing Section ───── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
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
              Simple Pricing
            </motion.div>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            >
              Start Free.{" "}
              <span className="gradient-text">Scale As You Grow.</span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            >
              14-day free trial on all plans. No credit card required.
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

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            >
              Loved by{" "}
              <span className="gradient-text">2,400+ D2C Brands</span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-[#fbbf24] text-[#fbbf24]"
                    />
                  ))}
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">
                      {t.role}
                    </div>
                  </div>
                </div>
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
            <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.12)] to-[rgba(6,182,212,0.06)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                Ready to Let AI Sell For You?
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
                Join 2,400+ Indian D2C brands already using Revmo to automate
                sales, recover abandoned carts, and grow revenue on autopilot.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="group flex items-center gap-2 gradient-bg text-white font-semibold px-8 py-4 rounded-xl text-base hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
                >
                  Start Free — 14 Days
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-4 flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> No credit card required · Setup
                in under 2 minutes
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
              <span className="text-lg font-extrabold">Revmo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              © 2026 Revmo.ai · Built with ❤️ in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
