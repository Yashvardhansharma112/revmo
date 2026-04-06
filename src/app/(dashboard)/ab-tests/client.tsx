"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FlaskConical, Plus, Play, Pause, CheckCheck, Trash2,
  Loader2, ChevronDown, ChevronUp, BarChart2, X,
  MessageCircle, Phone, Package, TrendingUp, Users, Percent,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type Variant = {
  id: string;
  name: string;
  prompt: string;
  is_control: boolean;
  visitors?: number;
  conversions?: number;
  conversion_rate?: number;
  revenue?: number;
};

type Experiment = {
  id: string;
  name: string;
  description: string | null;
  agent_type: "whatsapp" | "voice" | "inventory";
  status: "draft" | "running" | "paused" | "completed";
  traffic_split: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  variants: Variant[];
  results_count?: [{ count: number }];
  variant_stats?: Variant[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  draft:     "bg-zinc-800 text-zinc-400 border border-zinc-700",
  running:   "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  paused:    "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  completed: "bg-violet-500/15 text-violet-400 border border-violet-500/30",
};

const AGENT_ICONS: Record<string, React.ReactNode> = {
  whatsapp:  <MessageCircle className="w-4 h-4 text-[#25D366]" />,
  voice:     <Phone className="w-4 h-4 text-blue-400" />,
  inventory: <Package className="w-4 h-4 text-orange-400" />,
};

const AGENT_COLORS: Record<string, string> = {
  whatsapp:  "#25D366",
  voice:     "#60a5fa",
  inventory: "#f97316",
};

function StatPill({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 bg-[rgba(255,255,255,0.04)] rounded-xl px-4 py-3 min-w-[90px]">
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-[10px] font-bold uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <span className="text-lg font-extrabold text-white">{value}</span>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (exp: Experiment) => void }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    agent_type: "whatsapp" as "whatsapp" | "voice" | "inventory",
    traffic_split: 50,
    variantAName: "Control",
    variantAPrompt: "",
    variantBName: "Variant B",
    variantBPrompt: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error("Experiment name required"); return; }
    if (!form.variantAPrompt.trim() || !form.variantBPrompt.trim()) {
      toast.error("Both variant prompts are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ab/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          agent_type: form.agent_type,
          traffic_split: form.traffic_split,
          variants: [
            { name: form.variantAName, prompt: form.variantAPrompt },
            { name: form.variantBName, prompt: form.variantBPrompt },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success("Experiment created!", { description: "Start it when you're ready." });
      onCreate(data.experiment);
      onClose();
    } catch (err: any) {
      toast.error("Failed to create", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0d1f] border border-[rgba(255,255,255,0.1)] rounded-2xl p-7 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition cursor-pointer">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">New A/B Experiment</h2>
            <p className="text-sm text-zinc-500">Test two prompt variations head-to-head.</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Name + Agent type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Experiment Name</label>
              <input
                className="w-full bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
                placeholder="e.g. Urgency vs. Empathy tone"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Agent Type</label>
              <select
                className="w-full bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white appearance-none cursor-pointer"
                value={form.agent_type}
                onChange={e => setForm({ ...form, agent_type: e.target.value as any })}
              >
                <option value="whatsapp">WhatsApp Nudge</option>
                <option value="voice">Voice Closer</option>
                <option value="inventory">Inventory Agent</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Description <span className="text-zinc-600">(optional)</span></label>
            <input
              className="w-full bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white"
              placeholder="What hypothesis are you testing?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Traffic split */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Traffic Split</label>
              <span className="text-xs font-bold text-violet-400">{form.traffic_split}% → Control / {100 - form.traffic_split}% → Variant B</span>
            </div>
            <div className="relative">
              <input
                type="range" min={10} max={90} step={5}
                value={form.traffic_split}
                onChange={e => setForm({ ...form, traffic_split: parseInt(e.target.value) })}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>10%</span><span>50%</span><span>90%</span>
              </div>
            </div>
          </div>

          {/* Variant A */}
          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">A</span>
              <input
                className="flex-1 bg-transparent text-white font-bold text-sm border-b border-transparent focus:border-zinc-600 focus:outline-none pb-0.5 transition-colors"
                value={form.variantAName}
                onChange={e => setForm({ ...form, variantAName: e.target.value })}
              />
              <span className="text-[10px] text-zinc-600 font-medium">CONTROL</span>
            </div>
            <textarea
              className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-3 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none leading-relaxed"
              rows={4}
              placeholder="You are a friendly customer concierge. The user left items in their cart..."
              value={form.variantAPrompt}
              onChange={e => setForm({ ...form, variantAPrompt: e.target.value })}
            />
          </div>

          {/* Variant B */}
          <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 border border-[rgba(255,255,255,0.06)] space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-violet-500/20 text-violet-400 text-xs font-bold flex items-center justify-center">B</span>
              <input
                className="flex-1 bg-transparent text-white font-bold text-sm border-b border-transparent focus:border-zinc-600 focus:outline-none pb-0.5 transition-colors"
                value={form.variantBName}
                onChange={e => setForm({ ...form, variantBName: e.target.value })}
              />
              <span className="text-[10px] text-zinc-600 font-medium">CHALLENGER</span>
            </div>
            <textarea
              className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.06)] rounded-lg px-3 py-3 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed"
              rows={4}
              placeholder="You are an urgent sales assistant. The customer might lose their discount if they don't act now..."
              value={form.variantBPrompt}
              onChange={e => setForm({ ...form, variantBPrompt: e.target.value })}
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? "Creating..." : "Create Experiment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Experiment Card ──────────────────────────────────────────────────────────
function ExperimentCard({ experiment, onUpdate, onDelete }: {
  experiment: Experiment;
  onUpdate: (id: string, updates: Partial<Experiment>) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [stats, setStats] = useState<Variant[] | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const color = AGENT_COLORS[experiment.agent_type];
  const totalResults = experiment.results_count?.[0]?.count ?? 0;

  const handleStatusChange = async (newStatus: Experiment["status"]) => {
    setActioning(newStatus);
    try {
      const res = await fetch(`/api/ab/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(experiment.id, { status: newStatus });
      toast.success(`Experiment ${newStatus}`);
    } catch (err: any) {
      toast.error("Action failed", { description: err.message });
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this experiment? This cannot be undone.")) return;
    setActioning("delete");
    try {
      const res = await fetch(`/api/ab/experiments/${experiment.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDelete(experiment.id);
      toast.success("Experiment deleted");
    } catch (err: any) {
      toast.error("Delete failed", { description: err.message });
    } finally {
      setActioning(null);
    }
  };

  const loadStats = async () => {
    if (stats) { setExpanded(!expanded); return; }
    setExpanded(true);
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/ab/experiments/${experiment.id}`);
      const data = await res.json();
      setStats(data.experiment?.variant_stats ?? []);
    } catch {
      toast.error("Failed to load stats");
    } finally {
      setStatsLoading(false);
    }
  };

  const isRunning = experiment.status === "running";
  const isPaused = experiment.status === "paused";
  const isDraft = experiment.status === "draft";
  const isCompleted = experiment.status === "completed";

  return (
    <div className={`glass-card overflow-hidden transition-all hover:border-[rgba(255,255,255,0.12)]`}
      style={{ borderTop: `3px solid ${color}22`, borderTopColor: isRunning ? color : undefined }}>
      {/* Card Top */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${color}18` }}>
              {AGENT_ICONS[experiment.agent_type]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">{experiment.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize tracking-wide ${STATUS_STYLES[experiment.status]}`}>
                  {experiment.status}
                </span>
              </div>
              {experiment.description && (
                <p className="text-xs text-zinc-500 mt-0.5 truncate">{experiment.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-zinc-600">
                <span className="capitalize">{experiment.agent_type}</span>
                <span>·</span>
                <span>{experiment.traffic_split}/{100 - experiment.traffic_split} split</span>
                <span>·</span>
                <span>{totalResults} results</span>
                <span>·</span>
                <span>{new Date(experiment.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {(isDraft || isPaused) && (
              <button
                onClick={() => handleStatusChange("running")}
                disabled={!!actioning}
                className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {actioning === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {actioning === "running" ? "Starting..." : "Start"}
              </button>
            )}
            {isRunning && (
              <button
                onClick={() => handleStatusChange("paused")}
                disabled={!!actioning}
                className="flex items-center gap-1.5 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {actioning === "paused" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                Pause
              </button>
            )}
            {(isRunning || isPaused) && (
              <button
                onClick={() => handleStatusChange("completed")}
                disabled={!!actioning}
                className="flex items-center gap-1.5 bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                {actioning === "completed" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Complete
              </button>
            )}
            {(isDraft || isCompleted) && (
              <button
                onClick={handleDelete}
                disabled={!!actioning}
                className="flex items-center gap-1 text-red-500/60 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {actioning === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={loadStats}
              className="flex items-center gap-1 text-zinc-500 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition cursor-pointer"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded stats */}
      {expanded && (
        <div className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.25)] px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {statsLoading ? (
            <div className="flex items-center justify-center py-6 text-zinc-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading results...
            </div>
          ) : stats && stats.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                <BarChart2 className="w-3.5 h-3.5" />
                Variant Performance
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map((v) => {
                  const isControl = v.is_control;
                  const bgColor = isControl ? "rgba(52,211,153,0.06)" : "rgba(139,92,246,0.06)";
                  const borderColor = isControl ? "rgba(52,211,153,0.2)" : "rgba(139,92,246,0.2)";
                  const textColor = isControl ? "text-emerald-400" : "text-violet-400";
                  const label = isControl ? "CONTROL" : "CHALLENGER";
                  return (
                    <div key={v.id} className="rounded-xl p-4 border"
                      style={{ background: bgColor, borderColor }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${textColor}`}
                            style={{ background: isControl ? "rgba(52,211,153,0.15)" : "rgba(139,92,246,0.15)" }}>
                            {v.name[0]}
                          </span>
                          <span className="text-sm font-bold text-white">{v.name}</span>
                        </div>
                        <span className={`text-[9px] font-bold ${textColor} tracking-widest`}>{label}</span>
                      </div>
                      <p className="text-xs text-zinc-500 mb-3 line-clamp-2 leading-relaxed">{v.prompt}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <StatPill label="Visitors" value={v.visitors ?? 0} icon={<Users className="w-3 h-3" />} />
                        <StatPill label="Conv." value={`${v.conversion_rate ?? 0}%`} icon={<Percent className="w-3 h-3" />} />
                        <StatPill label="Revenue" value={`₹${(v.revenue ?? 0).toFixed(0)}`} icon={<TrendingUp className="w-3 h-3" />} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Determine winner */}
              {stats.length === 2 && stats[0].visitors! + stats[1].visitors! > 0 && (
                (() => {
                  const winner = stats[0].conversion_rate! >= stats[1].conversion_rate! ? stats[0] : stats[1];
                  const diff = Math.abs((stats[0].conversion_rate ?? 0) - (stats[1].conversion_rate ?? 0));
                  return diff > 0 ? (
                    <div className="mt-2 text-xs text-zinc-400 flex items-center gap-2 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                      <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>
                        <span className="font-bold text-white">{winner.name}</span> is currently leading by{" "}
                        <span className="text-emerald-400 font-bold">{diff.toFixed(1)}pp</span> in conversion rate.
                        {experiment.status !== "completed" && " Continue running for statistical significance."}
                      </span>
                    </div>
                  ) : null;
                })()
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <BarChart2 className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No results yet.</p>
              <p className="text-xs text-zinc-600 mt-1">
                {experiment.status === "draft" ? "Start the experiment to begin collecting data." : "Results will appear as visitors are assigned to variants."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page Client ─────────────────────────────────────────────────────────
export default function ABTestsClient() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "draft" | "running" | "paused" | "completed">("all");

  const fetchExperiments = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === "all" ? "/api/ab/experiments" : `/api/ab/experiments?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setExperiments(data.experiments ?? []);
    } catch {
      toast.error("Failed to load experiments");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchExperiments(); }, [fetchExperiments]);

  const handleUpdate = (id: string, updates: Partial<Experiment>) => {
    setExperiments(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDelete = (id: string) => {
    setExperiments(prev => prev.filter(e => e.id !== id));
  };

  const handleCreate = (newExp: Experiment) => {
    setExperiments(prev => [newExp, ...prev]);
  };

  const counts = {
    all: experiments.length,
    running: experiments.filter(e => e.status === "running").length,
    draft: experiments.filter(e => e.status === "draft").length,
    paused: experiments.filter(e => e.status === "paused").length,
    completed: experiments.filter(e => e.status === "completed").length,
  };

  const filtered = filter === "all" ? experiments : experiments.filter(e => e.status === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FlaskConical className="w-8 h-8 text-violet-400" />
            A/B Experiments
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
            Test prompt variations and let data decide your best agent strategy.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-violet-500/20 transition cursor-pointer flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          New Experiment
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: counts.all, color: "text-white" },
          { label: "Running", value: counts.running, color: "text-emerald-400" },
          { label: "Paused", value: counts.paused, color: "text-amber-400" },
          { label: "Done", value: counts.completed, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-zinc-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-xl p-1 self-start w-fit">
        {(["all", "running", "paused", "draft", "completed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
              filter === f
                ? "bg-violet-600 text-white shadow"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {f} {f !== "all" && counts[f] > 0 && <span className="ml-1 opacity-60">{counts[f]}</span>}
          </button>
        ))}
      </div>

      {/* Experiments List */}
      {loading ? (
        <div className="glass-card p-12 flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Loading experiments...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-14 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <FlaskConical className="w-8 h-8 text-violet-500/60" />
          </div>
          <div>
            <p className="text-lg font-bold text-zinc-400">No experiments {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
            <p className="text-sm text-zinc-600 mt-1 max-w-sm">
              Create your first A/B test to start optimising your agent prompts with real conversion data.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-2 flex items-center gap-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 px-5 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer border border-violet-500/20"
          >
            <Plus className="w-4 h-4" />
            Create your first experiment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(experiment => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
