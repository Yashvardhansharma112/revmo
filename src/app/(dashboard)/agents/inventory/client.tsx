"use client";

import { useEffect, useState } from "react";
import { Package, Save, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function InventoryAgentClient() {
  const [config, setConfig] = useState({
    isActive: false,
    forecastDays: "30",
    lowStockThreshold: "15",
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/api/agents/inventory");
        if (res.ok) {
          const { config: remoteConfig } = await res.json();
          if (remoteConfig?.settings) {
            setConfig(remoteConfig.settings);
          }
        }
      } catch (err) {
        toast.error("Failed to load inventory settings");
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agents/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: config }),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      setSaved(true);
      toast.success("Inventory Optimizer settings saved & deployed");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.error("Failed to save configuration. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-[var(--color-accent)] border-t-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-[#95c11f]" />
            Inventory Optimizer Configuration
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2 text-lg">
            Configure how the AI forecasts demand and runs chronologically every day.
          </p>
        </div>
        
        {/* Active Toggle Switch */}
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={config.isActive} 
            onChange={(e) => setConfig({...config, isActive: e.target.checked})} 
          />
          <div className="w-14 h-7 bg-[rgba(255,255,255,0.1)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--color-accent)]"></div>
          <span className="ml-3 text-sm font-bold text-white uppercase tracking-wider">
            {config.isActive ? "Online" : "Paused"}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border-t-4 border-t-[#95c11f]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" /> 
            Forecasting Math
          </h2>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Prediction Window (Days)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="7" 
                  max="90" 
                  className="flex-1 accent-[var(--color-accent)]"
                  value={config.forecastDays}
                  onChange={(e) => setConfig({...config, forecastDays: e.target.value})}
                />
                <span className="w-12 text-center text-white font-bold bg-[rgba(255,255,255,0.05)] py-1 rounded-lg">{config.forecastDays}</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">How far into the future should the agent predict demand using moving averages?</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">Low Stock Alert Threshold (%)</label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.08)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] text-white transition-colors"
                  value={config.lowStockThreshold}
                  onChange={(e) => setConfig({...config, lowStockThreshold: e.target.value})}
                />
                <span className="absolute right-4 top-3 text-[var(--color-text-muted)]">%</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">The AI drafts a PO if predicted stock coverage falls below this % of weekly demand.</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> 
            Smart Actions
          </h2>
          
          <div className="space-y-4">
             <div className="p-4 bg-[rgba(255,165,0,0.1)] border border-orange-500/20 rounded-xl relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-bold text-orange-400 text-sm">Automated Supply Chain Brain</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">This agent wakes up every morning at 8:00 AM. It scans your entire Shopify SKU catalog and runs a velocity assessment against your settings. If critical shortages are detected, it builds an intelligent raw order and alerts you immediately.</p>
              </div>
            </div>
            <div className="p-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-xl">
               <h4 className="font-bold text-white text-sm">API Scope Required</h4>
               <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-2">Ensure your Shopify Custom App API Token has `read_products` and `read_inventory` scopes enabled.</p>
            </div>
          </div>
        </div>
      </div>

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
          {saving ? "Deploying..." : saved ? "Agent Updated" : "Deploy Inventory Logic"}
        </button>
      </div>
    </div>
  );
}
