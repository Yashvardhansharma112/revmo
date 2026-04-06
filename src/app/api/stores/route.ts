import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateString, validateUrl } from "@/lib/validation";
import { encrypt } from "@/lib/encryption";

// GET - List user's stores
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team_id");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("stores")
      .select("*")
      .eq("user_id", user.id);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data: stores, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mask sensitive data
    const maskedStores = stores?.map(store => ({
      ...store,
      api_key_encrypted: store.api_key_encrypted ? "***" : null,
      api_secret_encrypted: store.api_secret_encrypted ? "***" : null,
      access_token_encrypted: store.access_token_encrypted ? "***" : null,
    })) || [];

    return NextResponse.json({ stores: maskedStores });
  } catch (err) {
    logApiError("/api/stores", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new store
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("store_add", ip);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, platform, store_url, team_id, api_key, api_secret, access_token, is_default, settings } = body;

    const nameValidation = validateString(name, { minLength: 1, maxLength: 100 });
    if (!nameValidation) {
      return NextResponse.json({ error: "Store name is required" }, { status: 400 });
    }

    const urlValidation = validateUrl(store_url);
    if (!urlValidation) {
      return NextResponse.json({ error: "Valid store URL is required" }, { status: 400 });
    }

    const validPlatform = ["shopify", "woocommerce", "magento"].includes(platform) ? platform : "shopify";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check team membership if team_id provided
    if (team_id) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("role")
        .eq("team_id", team_id)
        .eq("user_id", user.id)
        .single();

      if (!membership || !["owner", "admin", "member"].includes(membership.role)) {
        return NextResponse.json({ error: "Not a member of this team" }, { status: 403 });
      }
    }

    // Encrypt sensitive data
    const encryptedKey = api_key ? encrypt(api_key) : null;
    const encryptedSecret = api_secret ? encrypt(api_secret) : null;
    const encryptedToken = access_token ? encrypt(access_token) : null;

    // If setting as default, unset other defaults
    if (is_default) {
      await supabase
        .from("stores")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .insert({
        user_id: user.id,
        team_id: team_id || null,
        name: nameValidation,
        platform: validPlatform,
        store_url: urlValidation,
        api_key_encrypted: encryptedKey,
        api_secret_encrypted: encryptedSecret,
        access_token_encrypted: encryptedToken,
        is_default: is_default || false,
        settings: settings || {},
      })
      .select()
      .single();

    if (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 500 });
    }

    return NextResponse.json({
      store: {
        ...store,
        api_key_encrypted: "***",
        api_secret_encrypted: "***",
        access_token_encrypted: "***",
      }
    });
  } catch (err) {
    logApiError("/api/stores", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}