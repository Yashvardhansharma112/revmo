"use client";

import { motion, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  Bot,
  MessageCircle,
  Phone,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";

const DashboardCharts = dynamic(() => import("./DashboardCharts"), { ssr: false });

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

interface AgentActivity {
  agent_type: string;
  status: string;
  count: number;
  revenue: number;
}

const kpis = [
  {
    label: "Total Revenue",
    value: "₹8,24,500",
    change: "+18.2%",
    trend: "up",
    icon: DollarSign,
    color: "#10b981",
  },
  {
    label: "Orders",
    value: "1,248",
    change: "+12.5%",
    trend: "up",
    icon: ShoppingCart,
    color: "#7c3aed",
  },
  {
    label: "Active Customers",
    value: "3,642",
    change: "+8.3%",
    trend: "up",
    icon: Users,
    color: "#2563eb",
  },
  {
    label: "Products",
    value: "482",
    change: "-2.1%",
    trend: "down",
    icon: Package,
    color: "#f59e0b",
  },
];

const agentStatusMap: Record<string, any> = {
  inventory: { name: "Inventory Optimizer", icon: Package, color: "#10b981" },
  whatsapp: { name: "WhatsApp Nudge", icon: MessageCircle, color: "#7c3aed" },
  voice: { name: "Voice Closer", icon: Phone, color: "#2563eb" },
};

const recentActivity = [
  { type: "cart", text: "WhatsApp Agent recovered cart #4821 — ₹3,200", time: "2m ago", color: "#7c3aed" },
  { type: "stock", text: "Inventory Agent reordered 500 units of SKU-887", time: "15m ago", color: "#10b981" },
  { type: "call", text: "Voice Agent closed deal with lead #2847 — ₹8,500", time: "32m ago", color: "#2563eb" },
  { type: "cart", text: "WhatsApp Agent sent nudge to 24 abandoned carts", time: "1h ago", color: "#7c3aed" },
  { type: "insight", text: "AI detected demand spike for Ethnic Wear category", time: "2h ago", color: "#f59e0b" },
  { type: "stock", text: "Low stock alert: 3 products below safety level", time: "3h ago", color: "#ef4444" },
];

const insights = [
  {
    title: "Revenue Opportunity",
    description: "23 high-intent customers haven't been contacted. Activating Voice Closer could recover ₹1.2L.",
    action: "Activate Now",
    icon: TrendingUp,
    color: "#10b981",
  },
  {
    title: "Stock Alert",
    description: "5 products will be out of stock in 3 days based on current velocity. Auto-reorder recommended.",
    action: "Review Products",
    icon: Package,
    color: "#f59e0b",
  },
  {
    title: "Campaign Performance",
    description: "WhatsApp drip campaign has 94% open rate. Scaling to 2X audience recommended.",
    action: "Scale Campaign",
    icon: BarChart3,
    color: "#7c3aed",
  },
];

export default function DashboardPage() {
  const [agentActivity, setAgentActivity] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentActivity = async () => {
      try {
        const res = await fetch("/api/agents/activity?limit=10");
        if (res.ok) {
          const { activity } = await res.json();
          setAgentActivity(activity || []);
        }
      } catch (err) {
        console.error("Failed to load agent activity", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgentActivity();
  }, []);

  // Build agent status from activity
  const agentStatus = ["inventory", "whatsapp", "voice"].map((type) => {
    const agentData = agentActivity.filter((a) => a.agent_type === type);
    const totalActions = agentData.reduce((sum, a) => sum + a.count, 0);
    const totalRevenue = agentData.reduce((sum, a) => sum + (a.revenue || 0), 0);
    const config = agentStatusMap[type];
    return {
      name: config.name,
      icon: config.icon,
      status: "Active",
      color: config.color,
      metric: totalRevenue > 0 ? `₹${totalRevenue.toLocaleString()} recovered` : `${totalActions} actions`,
      actions: totalActions,
    };
  });
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Good evening — here&apos;s what your AI agents are doing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent-green)] bg-[rgba(16,185,129,0.1)] px-3 py-1.5 rounded-full">
            <Activity className="w-3 h-3" />
            All Agents Online
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            custom={i}
            className="glass-card kpi-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${kpi.color}15` }}
              >
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                  kpi.trend === "up"
                    ? "text-[#34d399] bg-[rgba(16,185,129,0.1)]"
                    : "text-[#ef4444] bg-[rgba(239,68,68,0.1)]"
                }`}
              >
                {kpi.trend === "up" ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {kpi.change}
              </span>
            </div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {kpi.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Analytics Charts — dynamically loaded client-side to prevent Recharts SSR dimension errors */}
      <DashboardCharts />


      {/* Grid: Agent Status + Activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Agent Status */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Bot className="w-4 h-4 text-[var(--color-accent)]" />
              Agent Status
            </h2>
            <span className="text-xs text-[var(--color-text-muted)]">
              Last updated: just now
            </span>
          </div>
          <div className="space-y-3">
            {agentStatus.map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${agent.color}15` }}
                >
                  <agent.icon
                    className="w-5 h-5"
                    style={{ color: agent.color }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{agent.name}</span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#34d399] bg-[rgba(16,185,129,0.1)] px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] pulse-dot" />
                      {agent.status}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {agent.metric}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{agent.actions}</div>
                  <div className="text-[10px] text-[var(--color-text-muted)]">
                    actions today
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-[var(--color-accent-orange)]" />
            Live Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3"
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {item.text}
                  </p>
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {item.time}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div>
        <h2 className="text-base font-bold flex items-center gap-2 mb-4">
          <Bot className="w-4 h-4 text-[var(--color-accent)]" />
          AI Insights
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass-card p-5 hover:border-[rgba(255,255,255,0.12)] transition cursor-pointer group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: `${insight.color}15` }}
              >
                <insight.icon
                  className="w-4 h-4"
                  style={{ color: insight.color }}
                />
              </div>
              <h3 className="text-sm font-bold mb-1">{insight.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">
                {insight.description}
              </p>
              <span className="text-xs font-semibold text-[var(--color-accent)] flex items-center gap-1 group-hover:gap-2 transition-all">
                {insight.action}
                <ArrowUpRight className="w-3 h-3" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
