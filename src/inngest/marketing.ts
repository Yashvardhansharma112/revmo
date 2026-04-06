import { inngest } from "./client";
import { createClient } from "@/lib/supabase/server";
import { add, set } from "date-fns";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { triggerVoiceCall } from "@/lib/bland";
import { decrypt } from "@/lib/encryption";

/**
 * Helper to check if a specific time is within the merchant's quiet hours
 */
function isQuietHours(
  now: Date, 
  startStr: string = "22:00", 
  endStr: string = "08:00"
) {
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const start = set(now, { hours: startH, minutes: startM, seconds: 0 });
  const end = set(now, { hours: endH, minutes: endM, seconds: 0 });

  // If start is after end (e.g. 10PM to 8AM), it spans across midnight
  if (start > end) {
    return now >= start || now <= end;
  }
  return now >= start && now <= end;
}

/**
 * 1. Campaign Fan-out
 * Triggered when a merchant launches a campaign
 */
export const processCampaign = inngest.createFunction(
  { 
    id: "marketing-fan-out", 
    name: "Campaign: Process & Fan-out",
    triggers: [{ event: "marketing/campaign.triggered" }]
  },
  async ({ event, step }) => {
    const { campaignId, userId } = event.data;
    const supabase = await createClient();

    // 1. Fetch Recipients & Campaign
    const { data: campaign } = await step.run("fetch-campaign", async () => {
      const { data } = await supabase
        .from("campaigns")
        .select(`*, campaign_variants (*)`)
        .eq("id", campaignId)
        .single();
      return data;
    });

    if (!campaign) return { error: "Campaign not found" };

    // Update campaign status
    await step.run("update-status", async () => {
      await supabase.from("campaigns").update({ status: "running", started_at: new Date() }).eq("id", campaignId);
    });

    // 2. Fetch recipients
    const recipients = await step.run("fetch-recipients", async () => {
       const { data } = await supabase
         .from("campaign_recipients")
         .select("id, contact_id")
         .eq("campaign_id", campaignId);
       return data || [];
    });

    // 3. Emit processing events for each recipient
    const events = (recipients || []).map((r: any) => {
       // Deterministic A/B Split based on contact_id hash (if AB test active)
       let variantId = campaign.campaign_variants[0]?.id;
       if (campaign.is_ab_test && campaign.campaign_variants.length > 1) {
          const charCodeSum = (r.contact_id as string).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          variantId = campaign.campaign_variants[charCodeSum % 2 === 0 ? 0 : 1]?.id;
       }

       return {
         name: "marketing/recipient.process" as const,
         data: {
           campaignId,
           recipientId: r.id,
           variantId,
           userId,
           stepIndex: 0,
         },
       };
    });

    // Send in batches of 50 to avoid hitting event size limits
    for (let i = 0; i < events.length; i += 50) {
      await step.sendEvent("fan-out-batch", events.slice(i, i + 50));
    }

    return { totalSent: recipients?.length || 0 };
  }
);

/**
 * 2. Recipient Sequential Engine
 * Process a single step for a single recipient
 */
export const executeSequenceStep = inngest.createFunction(
  { 
    id: "marketing-sequence-engine", 
    name: "Campaign: Execute Sequence Step",
    triggers: [{ event: "marketing/recipient.process" }]
  },
  async ({ event, step }) => {
    const { campaignId, recipientId, variantId, userId, stepIndex } = event.data;
    const supabase = await createClient();

    // 1. Fetch Variant & Step details
    const { variant } = await step.run("get-variant", async () => {
      const { data } = await supabase
        .from("campaign_variants")
        .select("*")
        .eq("id", variantId)
        .single();
      return { variant: data };
    });

    if (!variant || !variant.steps || !variant.steps[stepIndex]) {
       return { status: "no-more-steps" };
    }

    const currentStep = variant.steps[stepIndex];

    // 1.5 Stop Condition: Exit on Interaction
    if (currentStep.type !== 'delay') {
       const { shouldStop } = await step.run("check-stop-condition", async () => {
          const { data: interactions } = await supabase
            .from("agent_activity")
            .select("id")
            .eq("contact_id", recipientId)
            .eq("type", "customer_reply")
            .limit(1);
          
          return { shouldStop: interactions && interactions.length > 0 };
       });

       if (shouldStop) {
          await step.run("mark-converted", async () => {
             await supabase.from("campaign_recipients").update({ status: "converted" }).eq("id", recipientId);
          });
          return { status: "stopped", reason: "customer_interacted" };
       }
    }

    // 2. Safety Window / Quiet Hours Check
    const campaignSettings = await step.run("get-campaign-settings", async () => {
       const { data } = await supabase.from("campaigns").select("quiet_hours_start, quiet_hours_end").eq("id", campaignId).single();
       return data;
    });

    const now = new Date();
    if (isQuietHours(now, campaignSettings?.quiet_hours_start ?? undefined, campaignSettings?.quiet_hours_end ?? undefined)) {
       const [h, m] = (campaignSettings?.quiet_hours_end || "08:00").split(":").map(Number);
       const wakeTime = set(add(now, { days: now.getHours() >= 22 ? 1 : 0 }), { hours: h, minutes: m });
       await step.sleepUntil("wait-morning", wakeTime);
    }

    // 3. Execute the specific action
    if (currentStep.type === 'whatsapp') {
       const result = await step.run("send-whatsapp", async () => {
          // 3a. Fetch Recipient Data (phone)
          const { data: recipient } = await supabase
            .from("campaign_recipients")
            .select("contact_id")
            .eq("id", recipientId)
            .single();
          
          if (!recipient) throw new Error("Recipient contact details missing");

          // 3b. Fetch Merchant Config for WhatsApp
          const { data: configs } = await supabase
            .from("agent_configurations")
            .select("*")
            .eq("user_id", userId)
            .eq("agent_type", "whatsapp")
            .eq("is_active", true);

          const config = configs?.[0];
          if (!config || !config.settings?.senderId) {
            throw new Error("Merchant WhatsApp configuration missing or inactive");
          }

          // 3c. Fetch Keys (if stored in DB, otherwise use ENV)
          const { data: integrations } = await supabase
            .from("agent_configurations")
            .select("api_keys")
            .eq("user_id", userId)
            .eq("agent_type", "integrations")
            .single();

          const accountSid = (integrations?.api_keys?.twilioSid ? decrypt(integrations.api_keys.twilioSid) : process.env.TWILIO_ACCOUNT_SID) ?? undefined;
          const authToken = (integrations?.api_keys?.twilioToken ? decrypt(integrations.api_keys.twilioToken) : process.env.TWILIO_AUTH_TOKEN) ?? undefined;

          // 3d. Dispatch
          const res = await sendWhatsAppMessage({
            to: recipient.contact_id,
            body: currentStep.content,
            senderId: config.settings.senderId,
            accountSid,
            authToken
          });

          if (res.success) {
            await supabase.from("agent_activity").insert({
               user_id: userId,
               campaign_id: campaignId,
               variant_id: variantId,
               type: "automation",
               status: "completed",
               metadata: { step: stepIndex, channel: "whatsapp", messageSid: res.messageSid, content: currentStep.content }
            });

            await supabase.from("campaign_recipients")
               .update({ status: "sent", sent_at: new Date() })
               .eq("id", recipientId);
          } else {
            throw new Error(`Twilio Error: ${res.error}`);
          }
          
          return res;
       });
    } else if (currentStep.type === 'voice') {
       const result = await step.run("trigger-voice-call", async () => {
          // 3a. Fetch Recipient Data
          const { data: recipient } = await supabase
            .from("campaign_recipients")
            .select("contact_id")
            .eq("id", recipientId)
            .single();
          
          if (!recipient) throw new Error("Recipient contact details missing");

          // 3b. Fetch Merchant Config for Voice
          const { data: configs } = await supabase
            .from("agent_configurations")
            .select("*")
            .eq("user_id", userId)
            .eq("agent_type", "voice")
            .eq("is_active", true);

          const config = configs?.[0];
          
          // 3c. Fetch Bland API Key
          const { data: integrations } = await supabase
            .from("agent_configurations")
            .select("api_keys")
            .eq("user_id", userId)
            .eq("agent_type", "integrations")
            .single();

          const blandKey = (integrations?.api_keys?.blandKey ? decrypt(integrations.api_keys.blandKey) : process.env.BLAND_API_KEY) ?? undefined;

          // 3d. Dispatch
          const res = await triggerVoiceCall({
            phoneNumber: recipient.contact_id,
            prompt: currentStep.content,
            voice: config?.settings?.voiceId || "nat",
            apiKey: blandKey
          });

          if (res.success) {
            await supabase.from("agent_activity").insert({
               user_id: userId,
               campaign_id: campaignId,
               variant_id: variantId,
               type: "automation",
               status: "completed",
               metadata: { step: stepIndex, channel: "voice", callId: res.callId, content: currentStep.content }
            });
          } else {
            throw new Error(`Bland.ai Error: ${res.error}`);
          }
          
          return res;
       });
    } else if (currentStep.type === 'delay') {
       const delayMs = (currentStep.delay_value || 1) * (
         currentStep.delay_unit === 'minutes' ? 60000 : 
         currentStep.delay_unit === 'hours' ? 3600000 : 
         86400000
       );
       await step.sleep("delay-step", `${delayMs}ms`);
    }

    // 4. Move to next step if exists
    if (variant.steps[stepIndex + 1]) {
       await step.sendEvent("next-step", {
          name: "marketing/recipient.process",
          data: {
            ...event.data,
            stepIndex: stepIndex + 1
          }
       });
    } else {
       await step.run("complete-recipient", async () => {
          await supabase.from("campaign_recipients")
            .update({ status: "delivered" })
            .eq("id", recipientId);
       });
    }

    return { success: true, stepCompleted: stepIndex };
  }
);
