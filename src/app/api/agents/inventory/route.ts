import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";

export async function GET(request: Request) {
  // Bot detection
  const botCheck = detectBot(request);
  if (botCheck.isBot) {
    return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
  }

  // Rate limit per user for API endpoints
  const userId = request.headers.get("x-user-id");
  if (userId) {
    const rateLimitResult = await checkRateLimit("api", userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agent_configurations")
    .select("*")
    .eq("user_id", user.id)
    .eq("agent_type", "inventory")
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data || null });
}

export async function POST(req: Request) {
  // Bot detection
  const botCheck = detectBot(req);
  if (botCheck.isBot) {
    return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
  }

  // Rate limit per user for API endpoints
  const userId = req.headers.get("x-user-id");
  if (userId) {
    const rateLimitResult = await checkRateLimit("api", userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { settings } = await req.json();

    const { error } = await supabase
      .from("agent_configurations")
      .upsert({
        user_id: user.id,
        agent_type: "inventory",
        settings: settings, 
        is_active: settings.isActive || false,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id, agent_type"
      });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logApiError("/api/agents/inventory", error as Error, user.id);
    console.error("Save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
