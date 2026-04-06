import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logApiError } from "@/lib/logger";
import { encrypt, decrypt } from "@/lib/encryption";

// PATCH - Update store
export async function PATCH(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { store_id, name, is_default, api_key, api_secret, access_token, settings, status } = body;

    if (!store_id) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existingStore } = await supabase
      .from("stores")
      .select("user_id, team_id")
      .eq("id", store_id)
      .single();

    if (!existingStore || existingStore.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (is_default !== undefined) {
      updateData.is_default = is_default;
      if (is_default) {
        await supabase.from("stores").update({ is_default: false }).neq("id", store_id);
      }
    }
    if (api_key) updateData.api_key_encrypted = encrypt(api_key);
    if (api_secret) updateData.api_secret_encrypted = encrypt(api_secret);
    if (access_token) updateData.access_token_encrypted = encrypt(access_token);
    if (settings) updateData.settings = settings;
    if (status) updateData.status = status;

    const { data: store, error } = await supabase
      .from("stores")
      .update(updateData)
      .eq("id", store_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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
    logApiError("/api/stores/update", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove store
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("store_id");

  if (!storeId) {
    return NextResponse.json({ error: "store_id required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const { data: existingStore } = await supabase
      .from("stores")
      .select("user_id")
      .eq("id", storeId)
      .single();

    if (!existingStore || existingStore.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await supabase.from("stores").delete().eq("id", storeId);

    return NextResponse.json({ success: true });
  } catch (err) {
    logApiError("/api/stores/delete", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}