import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";

// Log agent activity (called by Inngest functions after each agent run)
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    // Rate limit - 50 logs per minute
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("api", ip);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agent_type, action_type, status, details, amount_recovered } = body;

    // Validate required fields
    const validAgents = ["inventory", "whatsapp", "voice", "integrations"];
    const validStatuses = ["success", "failed", "pending"];
    
    if (!agent_type || !validAgents.includes(agent_type)) {
      return NextResponse.json({ error: "Invalid agent type" }, { status: 400 });
    }
    
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Insert activity log
    const { data, error } = await supabase
      .from("agent_activity")
      .insert({
        user_id: user.id,
        agent_type,
        action_type: action_type || "agent_run",
        status,
        details: details || {},
        amount_recovered: amount_recovered || 0,
      })
      .select()
      .single();

    if (error) {
      logApiError("/api/agents/activity", error, user.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    logApiError("/api/agents/activity", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get agent activity logs for dashboard
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentType = searchParams.get("agent_type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("agent_activity")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (agentType && ["inventory", "whatsapp", "voice", "integrations"].includes(agentType)) {
    query = query.eq("agent_type", agentType);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get summary stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayStats } = await supabase
    .from("agent_activity")
    .select("agent_type, status, amount_recovered")
    .eq("user_id", user.id)
    .gte("created_at", today.toISOString());

  const summary = {
    totalActions: todayStats?.length || 0,
    successfulActions: todayStats?.filter(a => a.status === "success").length || 0,
    revenueRecovered: todayStats?.reduce((sum, a) => sum + (a.amount_recovered || 0), 0) || 0,
    byAgent: {
      whatsapp: todayStats?.filter(a => a.agent_type === "whatsapp").length || 0,
      voice: todayStats?.filter(a => a.agent_type === "voice").length || 0,
      inventory: todayStats?.filter(a => a.agent_type === "inventory").length || 0,
    }
  };

  return NextResponse.json({ activities: data || [], summary });
}