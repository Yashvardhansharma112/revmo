"use client";

import { useState } from "react";
import { Zap, CreditCard, User, AlertCircle, CheckCircle2 } from "lucide-react";

export function UserSettingsClient({ userEmail, subscription }: { userEmail: string, subscription: any }) {
  const [activeTab, setActiveTab] = useState("billing");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"stripe" | "razorpay">("stripe");
  const [error, setError] = useState("");

  const isActive = subscription?.status === "active";

  const handleCheckout = async () => {
    setLoading(true);
    setError("");
    try {
      if (provider === "stripe") {
        const res = await fetch("/api/checkout/stripe", { method: "POST" });
        const data = await res.json();
        if (data.url) window.location.href = data.url;
        else if (data.error) setError(data.error);
      } else {
        const res = await fetch("/api/checkout/razorpay", { method: "POST" });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);

        // Razorpay checkout flow
        const options = {
          key: data.keyId,
          subscription_id: data.subscriptionId,
          name: "StorePilot",
          description: "Pro Subscription",
          prefill: { email: userEmail },
          handler: function (response: any) {
            // Need to verify standard razorpay webhook will handle fulfillment
            // But we can reload the page to check status
            window.location.reload();
          },
          theme: { color: "#7c3aed" }
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex border-b border-[var(--color-border-glass)] mb-8">
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "account"
              ? "border-[var(--color-accent)] text-white"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2"><User className="w-4 h-4"/> Account</div>
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "billing"
              ? "border-[var(--color-accent)] text-white"
              : "border-transparent text-[var(--color-text-secondary)] hover:text-white"
          }`}
        >
          <div className="flex items-center gap-2"><CreditCard className="w-4 h-4"/> Billing & Plans</div>
        </button>
      </div>

      {activeTab === "account" && (
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-muted)]">Email Address</label>
              <div className="mt-1 p-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-glass)] text-sm">
                {userEmail}
              </div>
            </div>
            {/* Adding password reset etc. later */}
          </div>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-6">
          {/* Current Plan Card */}
          <div className="glass-card p-6 rounded-2xl border border-[var(--color-border-glass)]">
            <h2 className="text-xl font-bold mb-4">Current Subscription</h2>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[var(--color-border-glass)] mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{isActive ? "Pro Plan" : "Free Plan"}</span>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {isActive 
                    ? `Active subscription via ${subscription.provider}.` 
                    : "Upgrade to unlock AI agents and premium tools."}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">
                  {isActive ? "Active" : "$0"}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {!isActive && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3 text-[var(--color-text-muted)]">Select Payment Provider</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setProvider("stripe")}
                      className={`flex-1 p-4 rounded-xl border transition-all ${
                        provider === "stripe" 
                          ? "bg-[rgba(99,102,241,0.1)] border-indigo-500 text-indigo-400" 
                          : "bg-[rgba(255,255,255,0.02)] border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-white/20"
                      }`}
                    >
                      <div className="font-bold mb-1">Stripe</div>
                      <div className="text-xs opacity-70">International (Credit Cards)</div>
                    </button>
                    
                    <button
                      onClick={() => setProvider("razorpay")}
                      className={`flex-1 p-4 rounded-xl border transition-all ${
                        provider === "razorpay" 
                          ? "bg-[rgba(59,130,246,0.1)] border-blue-500 text-blue-400" 
                          : "bg-[rgba(255,255,255,0.02)] border-[var(--color-border-glass)] text-[var(--color-text-secondary)] hover:border-white/20"
                      }`}
                    >
                      <div className="font-bold mb-1">Razorpay</div>
                      <div className="text-xs opacity-70">India (UPI, Cards, NetBanking)</div>
                    </button>
                  </div>
                </div>

                <div className="p-1">
                  <button 
                    onClick={handleCheckout} 
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Initializing..." : "Upgrade to Pro"}
                    <Zap className="w-4 h-4 fill-current"/>
                  </button>
                </div>
              </div>
            )}
            
            {isActive && (
              <div className="p-1">
                <button 
                  onClick={async () => {
                     // We will implement customer portal routing later
                     alert("Customer portal routing to be implemented.");
                  }} 
                  className="px-4 py-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-sm font-medium hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
      
      {/* Load Razorpay SDK if needed */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </>
  );
}
