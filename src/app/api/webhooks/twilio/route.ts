import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Acts as the two-way bridge between Twilio WhatsApp replies and OpenAI.
 * When a customer replies to our Nudge Agent, Twilio posts here in x-www-form-urlencoded format.
 */
export async function POST(request: Request) {
  try {
    const textBody = await request.text();
    const searchParams = new URLSearchParams(textBody);
    
    const from = searchParams.get('From'); // e.g. whatsapp:+123456789
    const body = searchParams.get('Body');
    const to = searchParams.get('To');     // e.g. whatsapp:+198765432 (Our Merchant's SenderId)

    if (!from || !body || !to) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Locate the Merchant owning this specialized WhatsApp number
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: configs, error } = await supabase
      .from("agent_configurations")
      .select("user_id, settings")
      .eq("agent_type", "whatsapp");

    if (error || !configs) {
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    const config = configs.find(c => c.settings?.senderId === to && c.settings?.isActive);
    
    if (!config) {
      // Return empty TwiML to silently ignore messages sent to inactive bots
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    // 2. Extract Merchant's personal OpenAI Key 
    const { data: integrations } = await supabase
      .from("agent_configurations")
      .select("api_keys")
      .eq("user_id", config.user_id)
      .eq("agent_type", "integrations")
      .single();

    if (!integrations?.api_keys?.openaiKey) {
      return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", { status: 200, headers: { "Content-Type": "text/xml" }}); 
    }

    const { openaiKey } = integrations.api_keys;
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
          { role: "user", content: body }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const aiData = await aiRes.json();
    const replyMessage = aiData.choices[0]?.message?.content || "I'm having trouble connecting right now, but a human will reach out shortly!";

    // 4. Return TwiML XML immediately to leverage zero-latency messaging
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`;

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
