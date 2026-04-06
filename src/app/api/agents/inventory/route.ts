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

  // Auth first — user.id is the only trustworthy identifier for rate limiting
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per authenticated user (not the spoofable x-user-id header)
  const rateLimitResult = await checkRateLimit("api", user.id);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
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

  // Auth first — user.id is the only trustworthy identifier for rate limiting
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit per authenticated user (not the spoofable x-user-id header)
  const rateLimitResult = await checkRateLimit("api", user.id);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
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

  // Validate lowStockThreshold (integer, 1-1000)
  if (settingsValidation.lowStockThreshold !== undefined) {
    const threshold = validateInteger(settingsValidation.lowStockThreshold, 1, 1000);
    if (threshold === null) {
      return NextResponse.json(
        { error: "Low stock threshold must be 1-1000" },
        { status: 400 }
      );
    }
    validatedSettings.lowStockThreshold = threshold;
  }

  // Validate forecastDays (integer, 7-90)
  if (settingsValidation.forecastDays !== undefined) {
    const forecast = validateInteger(settingsValidation.forecastDays, 7, 90);
    if (forecast === null) {
      return NextResponse.json(
        { error: "Forecast days must be 7-90" },
        { status: 400 }
      );
    }
    validatedSettings.forecastDays = forecast;
  }

  // Validate vendorEmail (email format if provided)
  if (settingsValidation.vendorEmail) {
    const vendorEmail = validateString(settingsValidation.vendorEmail, {
      maxLength: 254,
    });
    if (vendorEmail) {
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorEmail)) {
        return NextResponse.json(
          { error: "Invalid vendor email format" },
          { status: 400 }
        );
      }
      validatedSettings.vendorEmail = vendorEmail;
    }
  }

  // Validate isActive is boolean
  if (settingsValidation.isActive !== undefined) {
    validatedSettings.isActive = Boolean(settingsValidation.isActive);
  }

  try {
    const { error } = await supabase
      .from("agent_configurations")
      .upsert({
        user_id: user.id,
        agent_type: "inventory",
        settings: validatedSettings, 
        is_active: validatedSettings.isActive || false,
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
