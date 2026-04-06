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
    .eq("agent_type", "voice")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || { settings: { persona: 'sarah', script: '' } } });
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

  const body = await req.json();
  const { persona, script } = body;

  const { data, error } = await supabase
    .from("agent_configurations")
    .upsert(
      {
        user_id: user.id,
        agent_type: "voice",
        settings: { persona, script },
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, agent_type" }
    )
    .select()
    .single();

  if (error) {
    console.error("Voice config save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
