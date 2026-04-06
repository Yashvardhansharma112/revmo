import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError, logSecurityEvent } from "@/lib/logger";
import { validateString, validatePhoneNumber } from "@/lib/validation";
import { decrypt } from "@/lib/encryption";

// Test mode - send a test WhatsApp message
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    // Rate limit - 5 test messages per minute
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("api", ip);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Wait a moment." }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { test_type, phone, message, agent_type } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate test type
    const validTestTypes = ["whatsapp_message", "voice_call", "inventory_scan"];
    if (!test_type || !validTestTypes.includes(test_type)) {
      return NextResponse.json({ error: "Invalid test type" }, { status: 400 });
    }

    // Get user's API keys
    const { data: keysData } = await supabase
      .from("agent_configurations")
      .select("api_keys")
      .eq("user_id", user.id)
      .eq("agent_type", "integrations")
      .single();

    // Log the test attempt
    await supabase.from("agent_tests").insert({
      user_id: user.id,
      agent_type: agent_type || "whatsapp",
      test_type,
      recipient: phone || "self",
      status: "pending",
    });

    if (test_type === "whatsapp_message") {
      // Validate phone number
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }

      // Validate message
      const messageValidation = validateString(message, { maxLength: 1000 });
      if (!messageValidation) {
        return NextResponse.json({ error: "Message is required" }, { status: 400 });
      }

      // Get Twilio credentials
      if (!keysData?.api_keys?.twilioSid || !keysData?.api_keys?.twilioToken) {
        return NextResponse.json({ error: "Twilio not configured. Add keys in Integrations." }, { status: 400 });
      }

      const twilioSidResult = decrypt(keysData.api_keys.twilioSid);
      const twilioTokenResult = decrypt(keysData.api_keys.twilioToken);

      if (!twilioSidResult || !twilioTokenResult) {
        return NextResponse.json({ error: "Failed to decrypt Twilio credentials. Check your ENCRYPTION_KEY." }, { status: 500 });
      }

      const twilioSid = twilioSidResult;
      const twilioToken = twilioTokenResult;

      // Get WhatsApp config for sender
      const { data: waConfig } = await supabase
        .from("agent_configurations")
        .select("settings")
        .eq("user_id", user.id)
        .eq("agent_type", "whatsapp")
        .single();

      if (!waConfig?.settings?.senderId) {
        return NextResponse.json({ error: "WhatsApp not configured. Set up in WhatsApp Agent." }, { status: 400 });
      }

      // Send test WhatsApp message via Twilio
      const twimlMessage = `🧪 TEST MESSAGE\n\n${messageValidation}\n\n— From StorePilot Test Mode`;
      
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

      const twilioRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: waConfig.settings.senderId,
          To: phoneValidation,
          Body: twimlMessage,
        }),
      });

      const twilioResult = await twilioRes.json();

      if (!twilioRes.ok) {
        logApiError("/api/agents/tests", new Error(twilioResult.message || "Twilio error"));
        return NextResponse.json({ error: `Failed to send: ${twilioResult.message}` }, { status: 500 });
      }

      // Update test status
      await supabase
        .from("agent_tests")
        .update({ status: "sent", response: "Message sent successfully" })
        .eq("user_id", user.id)
        .eq("test_type", "whatsapp_message")
        .order("created_at", { ascending: false })
        .limit(1);

      logSecurityEvent("test_whatsapp_sent", `Test WhatsApp sent to ${phoneValidation.substring(0, 5)}***`);

      return NextResponse.json({
        success: true,
        message: "Test WhatsApp message sent!",
        sid: twilioResult.sid,
      });
    }

    if (test_type === "voice_call") {
      // Validate phone
      const phoneValidation = validatePhoneNumber(phone);
      if (!phoneValidation) {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }

      // Get Bland AI credentials
      if (!keysData?.api_keys?.bland) {
        return NextResponse.json({ error: "Bland.ai not configured. Add key in Integrations." }, { status: 400 });
      }

      const blandKeyResult = decrypt(keysData.api_keys.bland);

      if (!blandKeyResult) {
        return NextResponse.json({ error: "Failed to decrypt Bland AI key. Check your ENCRYPTION_KEY." }, { status: 500 });
      }

      const blandKey = blandKeyResult;

      // Get voice config
      const { data: voiceConfig } = await supabase
        .from("agent_configurations")
        .select("settings")
        .eq("user_id", user.id)
        .eq("agent_type", "voice")
        .single();

      const voiceSettings = (voiceConfig?.settings as any) || {};
      const script = message || voiceSettings.script || "Hello, this is a test call from StorePilot.";
      const persona = voiceSettings.persona || "sarah";

      // Trigger test call via Bland AI
      const blandRes = await fetch("https://api.bland.ai/call", {
        method: "POST",
        headers: {
          "Authorization": blandKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneValidation,
          task: script,
          voice_id: persona,
          reduce_latency: true,
        }),
      });

      const blandResult = await blandRes.json();

      if (!blandRes.ok) {
        logApiError("/api/agents/tests", new Error(blandResult.error || "Bland AI error"));
        return NextResponse.json({ error: `Failed to call: ${blandResult.error}` }, { status: 500 });
      }

      // Update test status
      await supabase
        .from("agent_tests")
        .update({ status: "sent", response: `Call initiated: ${blandResult.call_id}` })
        .eq("user_id", user.id)
        .eq("test_type", "voice_call")
        .order("created_at", { ascending: false })
        .limit(1);

      logSecurityEvent("test_voice_call", `Test voice call initiated to ${phoneValidation.substring(0, 5)}***`);

      return NextResponse.json({
        success: true,
        message: "Test call initiated!",
        callId: blandResult.call_id,
      });
    }

    if (test_type === "inventory_scan") {
      // Get Shopify credentials
      if (!keysData?.api_keys?.shopifyUrl || !keysData?.api_keys?.shopifyToken) {
        return NextResponse.json({ error: "Shopify not configured. Add credentials in Integrations." }, { status: 400 });
      }

      const shopifyUrl = keysData.api_keys.shopifyUrl;
      const shopifyTokenResult = decrypt(keysData.api_keys.shopifyToken);

      if (!shopifyTokenResult) {
        return NextResponse.json({ error: "Failed to decrypt Shopify token. Check your ENCRYPTION_KEY." }, { status: 500 });
      }

      const shopifyToken = shopifyTokenResult;

      // Extract shop name
      const shopMatch = shopifyUrl.match(/([a-zA-Z0-9-]+)\.myshopify\.com/);
      if (!shopMatch) {
        return NextResponse.json({ error: "Invalid Shopify URL" }, { status: 400 });
      }

      // Fetch sample products
      const shopifyRes = await fetch(`https://${shopMatch[0]}/admin/api/2024-01/products.json?limit=5`, {
        headers: {
          "X-Shopify-Access-Token": shopifyToken,
          "Content-Type": "application/json",
        },
      });

      if (!shopifyRes.ok) {
        return NextResponse.json({ error: "Failed to connect to Shopify. Check API token." }, { status: 500 });
      }

      const products = await shopifyRes.json();

      // Update test status
      await supabase
        .from("agent_tests")
        .update({ 
          status: "delivered", 
          response: `Scanned ${products.products?.length || 0} products` 
        })
        .eq("user_id", user.id)
        .eq("test_type", "inventory_scan")
        .order("created_at", { ascending: false })
        .limit(1);

      return NextResponse.json({
        success: true,
        message: "Inventory scan test completed!",
        products: products.products?.slice(0, 3).map((p: any) => ({
          title: p.title,
          variants: p.variants?.length,
        })) || [],
      });
    }

    return NextResponse.json({ error: "Unknown test type" }, { status: 400 });
  } catch (err) {
    logApiError("/api/agents/tests", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get test history
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "10");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agent_tests")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tests: data || [] });
}