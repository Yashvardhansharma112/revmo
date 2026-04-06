"use client";

import { useState, useEffect } from "react";
import { Link2, Key, CheckCircle, Store, MessageCircle, Mic, Server, Users, Plus, Trash2, Edit2, FlaskConical } from "lucide-react";
import { toast } from "sonner";

export default function IntegrationsPage() {
  const [keys, setKeys] = useState({
    shopifyUrl: "",
    shopifyToken: "",
    openaiKey: "",
    twilioSid: "",
    twilioToken: "",
    bland: "",  // Note: backend expects "bland" not "blandaiKey"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

// Teams & Stores
  const [activeTab, setActiveTab] = useState<"integrations" | "stores" | "team" | "ab">("integrations");
  const [stores, setStores] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);

useEffect(() => {
    const fetchKeys = async () => {
      try {
        const res = await fetch("/api/agents/integrations");
        if (res.ok) {
          const { data } = await res.json();
          if (data && data.api_keys) {
            setKeys({
              shopifyUrl: data.api_keys.shopifyUrl || "",
              shopifyToken: data.api_keys.shopifyToken || "",
              openaiKey: data.api_keys.openaiKey || "",
              twilioSid: data.api_keys.twilioSid || "",
              twilioToken: data.api_keys.twilioToken || "",
              bland: data.api_keys.bland || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load integrations", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchStores = async () => {
      try {
        const res = await fetch("/api/stores");
        if (res.ok) {
          const { stores } = await res.json();
          setStores(stores || []);
        }
      } catch (err) {
        console.error("Failed to load stores", err);
      }
    };

    const fetchTeams = async () => {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const { teams } = await res.json();
          setTeams(teams || []);
        }
      } catch (err) {
        console.error("Failed to load teams", err);
      }
    };

    const fetchExperiments = async () => {
      try {
        const res = await fetch("/api/ab/experiments");
        if (res.ok) {
          const { experiments } = await res.json();
          setExperiments(experiments || []);
        }
      } catch (err) {
        console.error("Failed to load experiments", err);
      }
    };

    fetchKeys();
    fetchStores();
    fetchTeams();
    fetchExperiments();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_keys: keys }),
      });
      
      if (!res.ok) throw new Error("Failed to save keys");
      
      setSaved(true);
      toast.success("API Keys Encrypted & Saved", {
        description: "Your configurations are secured in the AES-256 vault."
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      setError("An error occurred while saving.");
      toast.error("Decryption Vault Failed", {
        description: "Please check your network and try again."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--color-text-secondary)]">Loading integrations...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <Link2 className="w-8 h-8 text-[var(--color-accent)]" />
          Integrations Hub
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
          Connect your store, LLM provider, and communication channels to bring your AI agents to life.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[rgba(255,255,255,0.1)] pb-2">
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "integrations"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <Link2 className="w-4 h-4 inline mr-2" />
          Integrations
        </button>
        <button
          onClick={() => setActiveTab("stores")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "stores"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <Store className="w-4 h-4 inline mr-2" />
          Stores
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "team"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Team
        </button>
        <button
          onClick={() => setActiveTab("ab")}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === "ab"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <FlaskConical className="w-4 h-4 inline mr-2" />
          A/B Tests
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Shopify / Ecom */}
        <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(149,193,31,0.1)] border border-[rgba(149,193,31,0.2)] flex items-center justify-center">
              <Store className="w-6 h-6 text-[#95c11f]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Shopify</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Data source for Inventory</p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Store URL</label>
              <input
                type="text"
                placeholder="yourstore.myshopify.com"
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                value={keys.shopifyUrl}
                onChange={(e) => setKeys({ ...keys, shopifyUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Admin API Token</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="shpat_..."
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors pr-10"
                  value={keys.shopifyToken}
                  onChange={(e) => setKeys({ ...keys, shopifyToken: e.target.value })}
                />
                <Key className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* OpenAI / LLM */}
        <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">OpenAI</h3>
              <p className="text-sm text-[var(--color-text-muted)]">LLM brains for logic</p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors pr-10"
                  value={keys.openaiKey}
                  onChange={(e) => setKeys({ ...keys, openaiKey: e.target.value })}
                />
                <Key className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-3.5" />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2 text-right">Must have gpt-4o access</p>
            </div>
          </div>
        </div>

        {/* Twilio / WhatsApp */}
        <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(37,211,102,0.1)] border border-[rgba(37,211,102,0.2)] flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#25D366]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Twilio WhatsApp</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Nudge delivery engine</p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Account SID</label>
              <input
                type="text"
                placeholder="AC..."
                className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                value={keys.twilioSid}
                onChange={(e) => setKeys({ ...keys, twilioSid: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Auth Token</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors pr-10"
                  value={keys.twilioToken}
                  onChange={(e) => setKeys({ ...keys, twilioToken: e.target.value })}
                />
                <Key className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Bland AI / Voice */}
        <div className="glass-card p-6 flex flex-col hover:border-[rgba(255,255,255,0.15)] transition-all">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[rgba(244,114,182,0.1)] border border-[rgba(244,114,182,0.2)] flex items-center justify-center">
              <Mic className="w-6 h-6 text-[#f472b6]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Bland.ai</h3>
              <p className="text-sm text-[var(--color-text-muted)]">Voice synthesis & calling</p>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">API Key</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="bland_..."
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors pr-10"
                  value={keys.bland}
                  onChange={(e) => setKeys({ ...keys, bland: e.target.value })}
                />
                <Key className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stores Tab */}
      {activeTab === "stores" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-400">Manage multiple stores (Shopify, WooCommerce, etc.)</p>
            <button
              onClick={() => { setEditingStore(null); setShowStoreModal(true); }}
              className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Store
            </button>
          </div>
          
          {stores.length === 0 ? (
            <div className="glass-card p-8 text-center text-zinc-500">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No stores connected yet</p>
              <p className="text-sm mt-2">Add your first store to enable multi-store support</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((store) => (
                <div key={store.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Store className="w-5 h-5 text-[var(--color-accent)]" />
                    <div>
                      <p className="font-bold text-white">{store.name}</p>
                      <p className="text-xs text-zinc-500">{store.store_url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.is_default && (
                      <span className="text-xs bg-[var(--color-accent)]/20 text-[var(--color-accent)] px-2 py-1 rounded">Default</span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${store.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {store.status}
                    </span>
                    <button
                      onClick={() => { setEditingStore(store); setShowStoreModal(true); }}
                      className="p-2 hover:bg-white/5 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Team Tab */}
      {activeTab === "team" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-400">Collaborate with your team members</p>
            <button
              onClick={() => {}}
              className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Team
            </button>
          </div>
          
          {teams.length === 0 ? (
            <div className="glass-card p-8 text-center text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No teams yet</p>
              <p className="text-sm mt-2">Create a team to collaborate with others</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams.map((team) => (
                <div key={team.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-[var(--color-accent)]" />
                    <div>
                      <p className="font-bold text-white">{team.name}</p>
                      <p className="text-xs text-zinc-500">Role: {team.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* A/B Tests Tab */}
      {activeTab === "ab" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-zinc-400">Test different agent prompts and compare results</p>
            <button
              onClick={() => {}}
              className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Experiment
            </button>
          </div>
          
          {experiments.length === 0 ? (
            <div className="glass-card p-8 text-center text-zinc-500">
              <FlaskConical className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No experiments yet</p>
              <p className="text-sm mt-2">Create A/B tests to optimize your agent prompts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experiments.map((exp) => (
                <div key={exp.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-white">{exp.name}</p>
                      <p className="text-xs text-zinc-500">{exp.agent_type} • {exp.status}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${exp.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-500/20 text-zinc-400'}`}>
                      {exp.status}
                    </span>
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>{exp.variants?.length || 0} variants</span>
                    <span>{exp.traffic_split}% / {100 - exp.traffic_split}% split</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "integrations" && error && <div className="text-red-500 text-sm text-right mt-2">{error}</div>}

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
            <Link2 className="w-5 h-5" />
          )}
          {saving ? "Encrypting & Saving..." : saved ? "Keys Saved Securely" : "Connect Integrations"}
        </button>
      </div>

      {/* Store Modal - simplified inline */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">{editingStore ? "Edit Store" : "Add Store"}</h3>
            <p className="text-sm text-zinc-500 mb-4">Multi-store support coming soon. Add your first store credentials.</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowStoreModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
