import twilio from "twilio";

/**
 * Sends a WhatsApp message using the Twilio API.
 * 
 * @param to - The recipient's phone number in E.164 format (e.g. +1234567890)
 * @param body - The message content
 * @param senderId - The merchant's WhatsApp Sender ID (e.g. whatsapp:+198765432)
 * @param accountSid - Twilio Account SID (defaults to ENV)
 * @param authToken - Twilio Auth Token (defaults to ENV)
 */
export async function sendWhatsAppMessage({
  to,
  body,
  senderId,
  accountSid = process.env.TWILIO_ACCOUNT_SID,
  authToken = process.env.TWILIO_AUTH_TOKEN,
}: {
  to: string;
  body: string;
  senderId: string;
  accountSid?: string;
  authToken?: string;
}) {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials missing");
  }

  const client = twilio(accountSid, authToken);

  // Ensure 'whatsapp:' prefix
  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const formattedFrom = senderId.startsWith('whatsapp:') ? senderId : `whatsapp:${senderId}`;

  try {
    const message = await client.messages.create({
      from: formattedFrom,
      to: formattedTo,
      body: body,
    });

    return { 
      success: true, 
      messageSid: message.sid, 
      status: message.status 
    };
  } catch (error: any) {
    console.error("[Twilio WhatsApp] Dispatch failed:", error);
    return { 
      success: false, 
      error: error.message || "Unknown Twilio error" 
    };
  }
}
