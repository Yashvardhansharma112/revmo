import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt, maskKey } from "@/lib/encryption";
import { checkRateLimit } from "@/lib/security";

export async function GET() {
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
  // so the client never sees the raw keys
  if (data && data.api_keys) {
    const maskedKeys: Record<string, string> = {};
    for (const [provider, encryptedKey] of Object.entries(data.api_keys as Record<string, string>)) {
      if (!encryptedKey) continue;
      
      const decrypted = decrypt(encryptedKey);
      // Fallback: if decryption failed or it's unencrypted plain string from Phase 2,
      // it returns same string, so just mask it regardless.
      maskedKeys[provider] = maskKey(decrypted);
    }
    data.api_keys = maskedKeys;
  }

  return NextResponse.json({ data: data || { api_keys: {} } });
}

export async function POST(req: Request) {
  // Rate limit: 20 per minute based on IP to stop credential stuffing
  const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
  const rateLimitResult = await checkRateLimit("api", ip);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Rate Limit Exceeded" },
      { status: 429, headers: { 'X-RateLimit-Reset': String(rateLimitResult.reset) } }
    );
  }

  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { api_keys } = body;

  // We must retrieve the existing row so we can avoid overwriting keys
  // if the user sent back a masked key ('****').
  // FIXED: Added user_id filter to prevent IDOR - only fetch THIS user's keys
  const { data: existingData } = await supabase
    .from("agent_configurations")
    .select("api_keys")
    .eq("user_id", user.id)
    .eq("agent_type", "integrations")
    .single();

  const existingApiKeys = (existingData?.api_keys as Record<string, string>) || {};
  
  const encryptedApiKeys: Record<string, string> = {};
  for (const [provider, rawKey] of Object.entries((api_keys || {}) as Record<string, string>)) {
    if (!rawKey) continue;
    
    // If key contains ****, it means it's heavily masked and the user didn't change it.
    // Retain the existing encrypted string.
    if (rawKey.includes('****')) {
      encryptedApiKeys[provider] = existingApiKeys[provider] || rawKey;
    } else {
      // It's a brand new raw key from user, encrypt it.
      encryptedApiKeys[provider] = encrypt(rawKey);
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
