/**
 * Triggers an AI Voice call using the Bland.ai API.
 * 
 * @param phoneNumber - The recipient's phone number in E.164 format
 * @param prompt - The task/script for the AI caller
 * @param voice - The voice persona (e.g. 'nat')
 * @param apiKey - Bland.ai API Key (defaults to ENV)
 * @param model - The model to use (e.g. 'enhanced')
 */
export async function triggerVoiceCall({
  phoneNumber,
  prompt,
  voice = "nat",
  apiKey = process.env.BLAND_API_KEY,
  model = "enhanced",
  language = "en-US",
}: {
  phoneNumber: string;
  prompt: string;
  voice?: string;
  apiKey?: string;
  model?: string;
  language?: string;
}) {
  if (!apiKey) {
    throw new Error("Bland.ai API key missing");
  }

  // Ensure E.164 format for Bland
  const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  try {
    const response = await fetch("https://api.bland.ai/v1/calls", {
      method: "POST",
      headers: {
        "Authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: formattedPhone,
        task: prompt,
        voice: voice,
        model: model,
        language: language,
        // Wait for response, but for Inngest we should probably handle webhook for status
        // For now, we just trigger.
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Bland.ai call trigger failed");
    }

    return { 
      success: true, 
      callId: data.call_id, 
      status: "triggered" 
    };
  } catch (error: any) {
    console.error("[Bland AI] Voice call dispatch failed:", error);
    return { 
      success: false, 
      error: error.message || "Unknown Bland.ai error" 
    };
  }
}
