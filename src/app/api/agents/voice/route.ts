import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateString, validateJsonObject } from "@/lib/validation";

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

  // Parse and validate request body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate persona - must be one of allowed values
  const validPersonas = ["sarah", "maya", "julia", "adam", "classic"];
  const personaValidation = validateString(body?.persona, {
    minLength: 1,
    maxLength: 50,
  });
  
  if (!personaValidation || !validPersonas.includes(personaValidation)) {
    return NextResponse.json(
      { error: `Persona must be one of: ${validPersonas.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate script - max 10000 characters
  const scriptValidation = validateString(body?.script, {
    maxLength: 10000,
  });

  const { data, error } = await supabase
    .from("agent_configurations")
    .upsert(
      {
        user_id: user.id,
        agent_type: "voice",
        settings: { persona: personaValidation, script: scriptValidation || "" },
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, agent_type" }
    )
    .select()
    .single();

  if (error) {
    logApiError("/api/agents/voice", error, user.id);
    console.error("Voice config save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
