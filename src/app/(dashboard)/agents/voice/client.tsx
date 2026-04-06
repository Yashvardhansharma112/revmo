"use client";

import { useState, useEffect } from "react";
import { Mic, Play, Pause, Save, CheckCircle, Volume2, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Sample voices data
const VOICES = [
  {
    id: "marcus",
    name: "Marcus",
    tagline: "Professional & Trustworthy",
    description: "Deep, crisp, and authoritative. Excellent for high-ticket B2B sales or luxury goods.",
    color: "#3b82f6", // blue
  },
  {
    id: "sarah",
    name: "Sarah",
    tagline: "Energetic & Friendly",
    description: "Upbeat and conversational. Perfect for fashion, beauty, and approaching abandoned carts gently.",
    color: "#f43f5e", // rose
  },
  {
    id: "arthur",
    name: "Arthur",
    tagline: "Calm & Reassuring",
    description: "Slow-paced and deeply soothing. Ideal for expensive custom orders or addressing complaints.",
    color: "#8b5cf6", // violet
  },
  {
    id: "maya",
    name: "Maya",
    tagline: "Direct & Analytics-driven",
    description: "Clear, concise, no-fluff delivery. Great for B2B wholesale reorders or technical products.",
    color: "#10b981", // emerald
  },
];

export default function VoiceAgentSetup() {
  const [selectedVoice, setSelectedVoice] = useState("sarah");
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [script, setScript] = useState(
    "Hi [Name], this is [Agent Name] from [Brand]. I noticed you left some amazing items in your cart. Can I help answer any questions or offer you a special 10% discount to complete your order today?"
  );
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    const fetchVoiceConfig = async () => {
      try {
        const res = await fetch("/api/agents/voice");
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.settings) {
            if (data.settings.persona) setSelectedVoice(data.settings.persona);
            if (data.settings.script) setScript(data.settings.script);
          }
        }
      } catch (err) {
        console.error("Failed to load voice configurations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVoiceConfig();
  }, []);

  // Mock audio player
  const togglePlay = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      // Simulate stopping after a few seconds
      setTimeout(() => setPlayingId(null), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedVoice, script }),
      });
      
      if (!res.ok) throw new Error("Failed to save persona");
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestCall = async () => {
    if (!testPhone) {
      toast.error("Please enter a phone number");
      return;
    }
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/agents/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          test_type: "voice_call",
          phone: testPhone,
          message: testMessage || undefined,
          agent_type: "voice"
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate call");
      setTestResult({ success: true, message: data.message || "Call initiated!" });
      toast.success("Test Call Initiated", { description: data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
      toast.error("Test Failed", { description: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Loading voice settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Mic className="w-8 h-8 text-[#f472b6]" />
          Voice Closer Configuration
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
          Select a persona and script for your AI voice caller.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-[var(--color-accent)]" /> 
          1. Select Voice Persona
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingId === voice.id;

            return (
              <div 
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`glass-card p-5 cursor-pointer transition-all duration-300 border-2 ${
                  isSelected 
                    ? "border-[var(--color-accent)] bg-[rgba(124,58,237,0.1)] shadow-[0_0_20px_rgba(124,58,237,0.2)]" 
                    : "border-transparent hover:border-[rgba(255,255,255,0.1)]"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white"
                      style={{ backgroundColor: voice.color }}
                    >
                      {voice.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{voice.name}</h3>
                      <p className="text-xs font-semibold" style={{ color: voice.color }}>
                        {voice.tagline}
                      </p>
                    </div>
                  </div>
                  
                  {/* Play Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay(voice.id);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isPlaying 
                        ? "bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/50" 
                        : "bg-[rgba(255,255,255,0.05)] text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                </div>
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {voice.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-6 border-t border-[rgba(255,255,255,0.1)] space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">2. Base Script / Goal</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          The AI will adapt to the conversation dynamically, but what should its opening line and primary objective be?
        </p>
        <textarea
          rows={4}
          className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors text-white resize-none"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <div className="flex gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
          Available tags: <span className="text-[var(--color-accent)]">[Name]</span> <span className="text-[var(--color-accent)]">[Agent Name]</span> <span className="text-[var(--color-accent)]">[Brand]</span>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm text-right mt-2">{error}</div>}

      <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="gradient-bg text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[var(--color-accent)]/20 hover:shadow-[var(--color-accent)]/40 transition flex items-center gap-2"
        >
          {saving ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : saved ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? "Saving..." : saved ? "Persona Saved" : "Save Voice Persona"}
        </button>
      </div>

      {/* Test Mode Section */}
      <div className="glass-card p-6 border-t-4 border-t-[var(--color-accent)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-[var(--color-accent)]" />
            <h3 className="text-lg font-bold text-white">Test Mode</h3>
          </div>
          <button
            onClick={() => setTestMode(!testMode)}
            className="text-sm text-[var(--color-accent)] hover:underline font-medium"
          >
            {testMode ? "Hide" : "Show"}
          </button>
        </div>
        
        {testMode && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-zinc-400">
              Initiate a test voice call to verify your voice agent is working correctly.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Test Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Custom Message (optional)</label>
                <input
                  type="text"
                  placeholder="Leave empty to use saved script"
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleTestCall}
                disabled={testLoading || !testPhone}
                className="bg-[var(--color-accent)]/20 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/30 px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                Initiate Test Call
              </button>
              {testResult && (
                <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-emerald-400" : "text-red-400"}`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-4 h-4 rounded-full bg-red-400/20 flex items-center justify-center text-xs">✕</span>}
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
