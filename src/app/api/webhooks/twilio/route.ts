import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";
import { sanitizeInput, checkRateLimit } from "@/lib/security";

// Twilio webhook signature verification
function verifyTwilioSignature(request: Request, body: string): boolean {
  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) return true; // Skip if no signature (development)
  
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (!twilioToken) return true; // Skip if no token configured
  
  const crypto = require("crypto");
  const url = request.url;
  const hmac = crypto.createHmac("sha1", twilioToken);
  hmac.update(url + body);
  const expectedSignature = hmac.digest("base64");
  
  return twilioSignature === expectedSignature;
}

/**
 * Acts as the two-way bridge between Twilio WhatsApp replies and OpenAI.
 * When a customer replies to our Nudge Agent, Twilio posts here in x-www-form-urlencoded format.
 * 
 * IDOR PROTECTION: This webhook verifies that:
 * 1. The receiving phone number belongs to an active WhatsApp agent (is_active = true)
 * 2. The merchant's config is properly linked via user_id ownership
 */
export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const searchParams = new URLSearchParams(textBody);
    
    const from = searchParams.get('From'); // e.g. whatsapp:+123456789
    const body = searchParams.get('Body');
    const to = searchParams.get('To');     // e.g. whatsapp:+198765432 (Our Merchant's SenderId)

    if (!from || !body || !to) {
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { 
        status: 200, 
        headers: { "Content-Type": "text/xml" }
      }); 
    }

    // Rate limit: 10 webhook hits per 10 seconds per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("webhook", ip);
    if (!rateLimitResult.success) {
      console.warn(`[Twilio Webhook] Rate limited IP: ${ip}`);
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { 
        status: 200, 
        headers: { "Content-Type": "text/xml" }
      });
    }

    // Sanitize incoming message to prevent prompt injection
    const sanitizedBody = sanitizeInput(body, 500);

    // 1. Locate the Merchant owning this specialized WhatsApp number
    // Use service role key to bypass RLS for server-side webhook processing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    // IDOR PROTECTION: Fetch all configs and filter by is_active AND senderId match
    const { data: configs, error } = await supabase
      .from("agent_configurations")
      .select("user_id, settings, is_active")
      .eq("agent_type", "whatsapp");

    if (error || !configs) {
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    // Find the ACTIVE config that matches the sender ID - prevents IDOR
    const config = configs.find(c => 
      c.is_active === true && 
      c.settings?.senderId === to && 
      c.settings?.isActive === true
    );
    
    if (!config) {
      // Return empty TwiML to silently ignore messages sent to inactive bots
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    // 2. Extract Merchant's personal OpenAI Key (verified by user_id ownership)
    const { data: integrations } = await supabase
      .from("agent_configurations")
      .select("api_keys")
      .eq("user_id", config.user_id)
      .eq("agent_type", "integrations")
      .single();

    if (!integrations?.api_keys?.openaiKey) {
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    // Decrypt the OpenAI key (it's stored encrypted)
    const decryptedKey = decrypt(integrations.api_keys.openaiKey);
    if (!decryptedKey) {
      console.error("[Twilio Webhook] Failed to decrypt OpenAI key. Check your ENCRYPTION_KEY.");
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { 
        status: 200, 
        headers: { "Content-Type": "text/xml" }
      });
    }

    const openaiKey = decryptedKey;

    const prompt = config.settings.prompt || "You are a customer service representative.";

    // 3. Consult LLM for the real-time objection breakdown
    console.log(`[Twilio Webhook] Consulting OpenAI for message from ${from}...`);
    
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `${prompt}\n\nA customer replied to an automated checkout recovery attempt via WhatsApp. Read their reply and generate a conversational response. Do not be pushy. Ask clarifying questions. Keep it under 2 sentences.` },
          { role: "user", content: sanitizedBody }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const aiData = await aiRes.json();
    const replyMessage = aiData.choices[0]?.message?.content || "I'm having trouble connecting right now, but a human will reach out shortly!";

    // 4. Escape XML special characters in the reply to prevent XXE injection
    const escapedReply = replyMessage
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    // 5. Record interaction in agent_activity for "Exit on Interaction" logic
    // We try to link the incoming message to an active campaign recipient by phone number
    const { data: recipient } = await supabase
      .from("campaign_recipients")
      .select("id, campaign_id, variant_id")
      .eq("contact_id", from) // 'from' is the customer phone
      .neq("status", "converted")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (recipient) {
      await supabase.from("agent_activity").insert({
        user_id: config.user_id,
        campaign_id: recipient.campaign_id,
        variant_id: recipient.variant_id,
        contact_id: recipient.id, // We use the recipient UUID as contact_id for sequence tracking
        type: "customer_reply",
        status: "completed",
        metadata: { 
          from: from, 
          body: sanitizedBody,
          channel: "whatsapp"
        }
      });

      // Also mark as 'delivered' (meaning they responded) or handled elsewhere
      // For now, the sequence engine checks for 'customer_reply' type.
    }

    // 6. Return TwiML XML immediately to leverage zero-latency messaging
    const twiml = `<?xml version="1.0\" encoding=\"UTF-8\"?>\n<Response>\n  <Message>${escapedReply}</Message>\n</Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml"
      }
    });

  } catch (error) {
    console.error("[Twilio Webhook] Failure:", error);
    return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
  }
}