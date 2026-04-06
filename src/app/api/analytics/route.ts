import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Get analytics data for dashboard
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Calculate date range
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get agent activities for the period
  const { data: activities } = await supabase
    .from("agent_activity")
    .select("agent_type, status, amount_recovered, created_at")
    .eq("user_id", user.id)
    .gte("created_at", startDate.toISOString());

  // Calculate metrics per agent
  const metrics = {
    whatsapp: { sent: 0, success: 0, revenue: 0, rate: 0 },
    voice: { sent: 0, success: 0, revenue: 0, rate: 0 },
    inventory: { scans: 0, alerts: 0, saved: 0 },
  };

  if (activities) {
    activities.forEach((a: any) => {
      if (a.agent_type === "whatsapp") {
        metrics.whatsapp.sent++;
        if (a.status === "success") {
          metrics.whatsapp.success++;
          metrics.whatsapp.revenue += a.amount_recovered || 0;
        }
      } else if (a.agent_type === "voice") {
        metrics.voice.sent++;
        if (a.status === "success") {
          metrics.voice.success++;
          metrics.voice.revenue += a.amount_recovered || 0;
        }
      } else if (a.agent_type === "inventory") {
        metrics.inventory.scans++;
        if (a.status === "success" && a.action_type === "low_stock_alert") {
          metrics.inventory.alerts++;
          metrics.inventory.saved += a.amount_recovered || 0;
        }
      }
    });

    // Calculate success rates
    metrics.whatsapp.rate = metrics.whatsapp.sent > 0 
      ? Math.round((metrics.whatsapp.success / metrics.whatsapp.sent) * 100) 
      : 0;
    metrics.voice.rate = metrics.voice.sent > 0 
      ? Math.round((metrics.voice.success / metrics.voice.sent) * 100) 
      : 0;
  }

  // Get recent agent runs
  const { data: recentRuns } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(10);

  // Get agent configurations status
  const { data: configs } = await supabase
    .from("agent_configurations")
    .select("agent_type, is_active, updated_at")
    .eq("user_id", user.id);

  const agentStatus = configs?.map((c: any) => ({
    agent: c.agent_type,
    active: c.is_active,
    lastRun: c.updated_at,
  })) || [];

  // Get today's activity
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: todayActivity } = await supabase
    .from("agent_activity")
    .select("agent_type, status")
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString());

  const todayStats = {
    totalActions: todayActivity?.length || 0,
    successfulActions: todayActivity?.filter((a: any) => a.status === "success").length || 0,
    revenueRecovered: todayActivity?.reduce((sum: number, a: any) => sum + (a.amount_recovered || 0), 0) || 0,
  };

  return NextResponse.json({
    period,
    metrics,
    recentRuns: recentRuns || [],
    agentStatus,
    today: todayStats,
    summary: {
      totalRevenue: metrics.whatsapp.revenue + metrics.voice.revenue + metrics.inventory.saved,
      whatsappRecoveryRate: metrics.whatsapp.rate,
      voiceRecoveryRate: metrics.voice.rate,
      inventoryAlerts: metrics.inventory.alerts,
    },
  });
}