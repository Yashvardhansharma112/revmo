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

  // Fetch the current settings for 'whatsapp'
  const { data } = await supabase
    .from("agent_configurations")
    .select("settings")
    .eq("user_id", user.id)
    .eq("agent_type", "whatsapp")
    .single();

  return NextResponse.json({ data: data || { settings: {} } });
}

export async function POST(request: Request) {
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

  const { settings } = await request.json();

  // Upsert the new config
  const { error } = await supabase
    .from("agent_configurations")
    .upsert(
      {
        user_id: user.id,
        agent_type: "whatsapp",
        settings, // Stored securely as JSON
        is_active: settings.isActive || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, agent_type" }
    );

  if (error) {
    console.error("Failed to save WhatsApp config", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true, settings });
}
