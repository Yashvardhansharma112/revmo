import { createClient } from "@/lib/supabase/server";
import { Lock } from "lucide-react";
import React from "react";

/**
 * A Next.js Server Component that acts as a SaaS Paywall.
 * It queries Supabase natively, and if the user lacks an 'active' Stripe status,
 * it permanently blurs out the dashboard content beneath it and intercepts clicks.
 */
export async function SubscriptionGuard({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If no user, bypass to login (middleware usually catches this first)
  if (!user) {
    return <>{children}</>;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  const isActive = subscription?.status === "active";

  // If they have paid, render the proprietary AI features seamlessly
  if (isActive) {
    return <>{children}</>;
  }

  // PAYWALL: Render blurred out background with aggressive CTA
  return (
    <div className="relative">
      {/* Blurred out proprietary UI behind the paywall */}
      <div className="opacity-30 pointer-events-none blur-sm select-none transition-all duration-700">
        {children}
      </div>
      
      {/* The Lock Overlay */}
      <div className="absolute inset-0 z-[100] flex items-center justify-center mt-[-10vh]">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl max-w-md text-center transform hover:scale-[1.02] transition-transform">
          
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <Lock className="w-10 h-10 text-emerald-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-3">Unlock AI Agents</h2>
          <p className="text-zinc-400 mb-8 font-light text-base leading-relaxed">
            You need an active subscription to configure AI agents, manage webhooks, and recover abandoned checkouts autonomously.
          </p>

          <form action="/api/checkout" method="POST">
            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-lg font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              Subscribe Now
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
