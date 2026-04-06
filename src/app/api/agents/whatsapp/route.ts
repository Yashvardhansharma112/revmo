import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateJsonObject, validateString, validateInteger } from "@/lib/validation";

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

  // Parse and validate request body
  let body;
  try {
    body = await request.json();
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

  // Validate settings object with strict schema
  const settingsValidation = validateJsonObject(body?.settings, undefined, 5);

  if (!settingsValidation) {
    return NextResponse.json(
      { error: "Invalid settings format" },
      { status: 400 }
    );
  }

  // Additional field-specific validation
  const validatedSettings: Record<string, unknown> = {};

  if (settingsValidation.senderId) {
    const senderId = validateString(settingsValidation.senderId, {
      minLength: 1,
      maxLength: 50,
      pattern: /^whatsapp:\+?[1-9]\d{1,14}$/,
    });
    if (!senderId) {
      return NextResponse.json(
        { error: "Invalid sender ID format" },
        { status: 400 }
      );
    }
    validatedSettings.senderId = senderId;
  }

  if (settingsValidation.prompt) {
    const prompt = validateString(settingsValidation.prompt, {
      maxLength: 5000,
    });
    validatedSettings.prompt = prompt;
  }

  if (settingsValidation.delayMinutes !== undefined) {
    const delay = validateInteger(settingsValidation.delayMinutes, 0, 1440);
    if (delay === null) {
      return NextResponse.json(
        { error: "Delay must be 0-1440 minutes" },
        { status: 400 }
      );
    }
    validatedSettings.delayMinutes = delay;
  }

  // Validate isActive is boolean
  if (settingsValidation.isActive !== undefined) {
    validatedSettings.isActive = Boolean(settingsValidation.isActive);
  }

  // Upsert the new config
  const { error } = await supabase
    .from("agent_configurations")
    .upsert(
      {
        user_id: user.id,
        agent_type: "whatsapp",
        settings: validatedSettings,
        is_active: validatedSettings.isActive || false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, agent_type" }
    );

  if (error) {
    logApiError("/api/agents/whatsapp", error, user.id);
    console.error("Failed to save WhatsApp config", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ success: true, settings: validatedSettings });
}
