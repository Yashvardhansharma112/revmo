"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Clock, Save, BrainCircuit, Activity } from "lucide-react";
import { toast } from "sonner";

export default function WhatsAppAgentClient() {
  const [settings, setSettings] = useState({
    isActive: false,
    senderId: "",
    delayMinutes: 15,
    prompt: "You are a customer concierge for our luxury brand. You noticed the user left some items in their cart. Do NOT be pushy. Ask if they experienced a technical issue or if they have questions about the product. Keep it under 2 sentences.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/agents/whatsapp");
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.settings) {
            setSettings({
              isActive: data.settings.isActive ?? false,
              senderId: data.settings.senderId || "",
              delayMinutes: data.settings.delayMinutes ?? 15,
              prompt: data.settings.prompt || "You are a customer concierge...",
            });
          }
        }
      } catch (err) {
        toast.error("Failed to load WhatsApp agent settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agents/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      
      if (!res.ok) throw new Error("Failed to save keys");
      
      toast.success("WhatsApp Configurations Saved", {
        description: "Your AI agent's brain has been successfully updated on the edge."
      });
    } catch (err) {
      console.error(err);
      toast.error("Save Failed", {
        description: "Please check your network and try again."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Loading agent configurations...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
            Sentiment Nudge Agent
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
            Configure your autonomous text agent to recover carts via WhatsApp.
          </p>
        </div>
        
        {/* Toggle Status */}
        <div className="flex items-center gap-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] px-5 py-3 rounded-2xl">
          <Activity className={`w-5 h-5 ${settings.isActive ? "text-emerald-400" : "text-zinc-500"}`} />
          <span className="font-bold text-sm text-white">Agent Status:</span>
          <button
            onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.isActive ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Column */}
        <div className="space-y-6 md:col-span-1 border-r border-white/5 pr-6">
          <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <h3 className="text-lg font-bold text-white">Twilio Setup</h3>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">WhatsApp Sender ID</label>
              <input
                type="text"
                placeholder="whatsapp:+14155238886"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#25D366] transition-colors"
                value={settings.senderId}
                onChange={(e) => setSettings({ ...settings, senderId: e.target.value })}
              />
              <p className="text-xs text-zinc-500 mt-2">The authorized business number from your Twilio console.</p>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Trigger Delay</h3>
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Minutes until fire</label>
              <input
                type="number"
                min="1"
                max="1440"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                value={settings.delayMinutes}
                onChange={(e) => setSettings({ ...settings, delayMinutes: parseInt(e.target.value) || 15 })}
              />
              <p className="text-xs text-zinc-500 mt-2">Give the customer time to buy organically.</p>
            </div>
          </div>
        </div>

        {/* Prompt Column */}
        <div className="md:col-span-2">
          <div className="glass-card p-6 h-full flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
            <div className="flex items-center gap-3 mb-6">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">The Brain (System Prompt)</h3>
            </div>
            
            <p className="text-sm text-zinc-400 mb-4">
              Write the persona and strict behavioral instructions you want the LLM to follow when drafting the personalized WhatsApp messages.
            </p>

            <textarea
              className="w-full flex-1 min-h-[300px] bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-zinc-300 leading-relaxed resize-none"
              value={settings.prompt}
              onChange={(e) => setSettings({ ...settings, prompt: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#25D366] text-black hover:bg-[#20bd5a] px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#25D366]/20 transition flex items-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin block" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Deploying Brain..." : "Deploy Configuration"}
        </button>
      </div>
    </div>
  );
}
