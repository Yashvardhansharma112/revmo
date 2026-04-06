import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt, maskKey } from "@/lib/encryption";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateJsonObject, validateString } from "@/lib/validation";

// Allowed API key providers
const ALLOWED_PROVIDERS = [
  "openaiKey", "bland", "twilioSid", "twilioToken", "shopifyUrl", "shopifyToken"
];

export async function GET(request: Request) {
  // Bot detection
  const botCheck = detectBot(request);
  if (botCheck.isBot) {
    return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
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
    .eq("agent_type", "integrations")
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is the code for zero rows returned which is fine for new users
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Decrypt and mask keys before sending to client
  // so the client never sees raw keys or ciphertext
  if (data && data.api_keys) {
    const maskedKeys: Record<string, string> = {};
    for (const [provider, encryptedKey] of Object.entries(data.api_keys as Record<string, string>)) {
      if (!encryptedKey) continue;

      const decrypted = decrypt(encryptedKey);
      if (decrypted === null) {
        // Decryption failed (key rotation / corrupt data) — show placeholder
        maskedKeys[provider] = "****";
      } else {
        maskedKeys[provider] = maskKey(decrypted);
      }
    }
    data.api_keys = maskedKeys;
  }

  return NextResponse.json({ data: data || { api_keys: {} } });
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

  const supabase = await createClient();

  // Auth before rate limiting — user.id cannot be spoofed unlike x-forwarded-for
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit by authenticated user.id (prevents credential-stuffing and IP spoofing)
  const rateLimitResult = await checkRateLimit("api", user.id);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate Limit Exceeded" },
      { status: 429, headers: { 'X-RateLimit-Reset': String(rateLimitResult.reset) } }
    );
  }

  // Validate api_keys object with strict schema
  const apiKeysValidation = validateJsonObject(body?.api_keys, undefined, 3);

  if (!apiKeysValidation) {
    return NextResponse.json(
      { error: "Invalid API keys format" },
      { status: 400 }
    );
  }

  // We must retrieve the existing row so we can avoid overwriting keys
  // if the user sent back a masked key ('****').
  const { data: existingData } = await supabase
    .from("agent_configurations")
    .select("api_keys")
    .eq("user_id", user.id)
    .eq("agent_type", "integrations")
    .single();

  const existingApiKeys = (existingData?.api_keys as Record<string, string>) || {};
  
  const encryptedApiKeys: Record<string, string> = {};
  
  // Only allow specific providers and validate each key
  for (const [provider, rawKey] of Object.entries(apiKeysValidation)) {
    // Only process allowed providers
    if (!ALLOWED_PROVIDERS.includes(provider)) {
      continue;
    }
    
    if (!rawKey) continue;
    
    // Validate the key is a string
    const keyString = validateString(rawKey, {
      maxLength: 500, // reasonable max for API keys
    });
    
    if (!keyString) continue;
    
    // If key contains ****, it means it's heavily masked and the user didn't change it.
    // Retain the existing encrypted string.
    if (keyString.includes('****')) {
      encryptedApiKeys[provider] = existingApiKeys[provider] || keyString;
    } else {
      // It's a brand new raw key from user, encrypt it.
      encryptedApiKeys[provider] = encrypt(keyString);
    }
  }

  const { data, error } = await supabase
    .from("agent_configurations")
    .upsert(
      {
        user_id: user.id,
        agent_type: "integrations",
        api_keys: encryptedApiKeys,
        is_active: Object.keys(encryptedApiKeys || {}).length > 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id, agent_type" }
    )
    .select()
    .single();

  if (error) {
    logApiError("/api/agents/integrations", error, user.id);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
