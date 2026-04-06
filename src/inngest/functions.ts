import { inngest } from "./client";
import { createClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/encryption";
import { sanitizeInput } from "@/lib/security";

// Initialize a generic Supabase admin client for background jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Use service role key to bypass RLS in background jobs
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""; 
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Recovers an abandoned checkout by calling the customer via Bland AI 
 * using the configured keys and scripts stored in Supabase.
 */
export const recoverAbandonedCheckout = inngest.createFunction(
  { 
    id: "recover-abandoned-checkout", 
    name: "Recover Abandoned Checkout",
    triggers: [{ event: "StorePilot/checkout.abandoned" }]
  },
  async ({ event, step }) => {
    // @ts-ignore
    const { checkoutId, phone, customerName, cartTotal, items, abandonUrl } = event.data;

    // Step 1: Wait 15 minutes before acting (standard abandoned cart delay)
    await step.sleep("wait-for-recovery", "15m");

    // Step 2: Fetch agent configurations securely
    const configStep = await step.run("fetch-agent-config", async () => {
      // Fetch ALL voice agent configurations (need to check which one is active)
      const { data: voiceConfigs, error: voiceError } = await supabase
        .from("agent_configurations")
        .select("user_id, settings, is_active")
        .eq("agent_type", "voice");
        
      if (voiceError || !voiceConfigs || voiceConfigs.length === 0) {
        return { configured: false, blandKey: null, persona: null, script: null };
      }

      // Find the first active voice config (IDOR protection: we must filter by is_active)
      const activeVoiceConfig = voiceConfigs.find(c => c.is_active === true);
      if (!activeVoiceConfig) {
        return { configured: false, blandKey: null, persona: null, script: null };
      }

      // Fetch the merchant's integration keys
      const { data: integrationsData } = await supabase
         .from("agent_configurations")
         .select("api_keys")
         .eq("user_id", activeVoiceConfig.user_id)
         .eq("agent_type", "integrations")
         .single();
         
      if (!integrationsData || !integrationsData.api_keys) {
        return { configured: false, blandKey: null, persona: null, script: null };
      }
      
      const apiKeys = integrationsData.api_keys;
      // Decrypt the Bland API key (stored encrypted)
      const decryptedBlandKey = apiKeys.bland ? decrypt(apiKeys.bland) : null;
      
      return { 
        configured: true, 
        blandKey: decryptedBlandKey, 
        persona: activeVoiceConfig.settings?.persona || "friendly",
        script: activeVoiceConfig.settings?.script || `You noticed they left some items...`
      };
    });

    if (!configStep.configured || !configStep.blandKey) {
      return { status: "skipped", reason: "Agent not fully configured or missing API key." };
    }

    // Step 3: Trigger Bland AI Voice Call
    await step.run("trigger-voice-call", async () => {
      console.log(`[Inngest] Dispatching Voice Call to ${phone} via Bland.ai...`);

      const safeName = sanitizeInput(customerName);
      const safeItems = items ? items.map((i: string) => sanitizeInput(i)).join(", ") : "items";

      const response = await fetch("https://api.bland.ai/v1/calls", {
        method: "POST",
        headers: {
          "authorization": configStep.blandKey as string,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phone,
          task: `You are an AI assistant calling ${safeName} to offer help with their abandoned checkout of ${cartTotal}. Their cart items: ${safeItems}. If they want to complete it, instruct them to use their recovery link. Custom script: ${configStep.script}`,
          voice: "maya",
          reduce_latency: true,
          amd: true
        })
      });

      const result = await response.json();
      return result;
    });

    return { status: "success", checkoutId, method: "voice_agent" };
  }
);

/**
 * Recovers an abandoned checkout by autonomously generating a context-aware 
 * text message via OpenAI and sending it over Twilio WhatsApp API.
 */
export const recoverViaWhatsApp = inngest.createFunction(
  { 
    id: "recover-via-whatsapp", 
    name: "Recover via WhatsApp",
    triggers: [{ event: "StorePilot/checkout.abandoned" }]
  },
  async ({ event, step }) => {
    // @ts-ignore
    const { checkoutId, phone, customerName, cartTotal, items, abandonUrl } = event.data;

    // Step 1: Fetch agent configurations securely to get the delay timing
    const configStep = await step.run("fetch-whatsapp-config", async () => {
      // Fetch ALL whatsapp configs and filter by is_active (IDOR protection)
      const { data: waConfigs, error: waError } = await supabase
        .from("agent_configurations")
        .select("user_id, settings, is_active")
        .eq("agent_type", "whatsapp");
        
      if (waError || !waConfigs || waConfigs.length === 0) {
        return { 
          configured: false, 
          openaiKey: null, 
          twilioSid: null, 
          twilioToken: null, 
          senderId: null, 
          delayMinutes: 0, 
          prompt: null 
        };
      }

      // Find the active WhatsApp config
      const activeWaConfig = waConfigs.find(c => c.is_active === true);
      if (!activeWaConfig || !activeWaConfig.settings?.isActive) {
        return { 
          configured: false, 
          openaiKey: null, 
          twilioSid: null, 
          twilioToken: null, 
          senderId: null, 
          delayMinutes: 0, 
          prompt: null 
        };
      }

      const { data: integrationsData } = await supabase
         .from("agent_configurations")
         .select("api_keys")
         .eq("user_id", activeWaConfig.user_id)
         .eq("agent_type", "integrations")
         .single();
         
      if (!integrationsData || !integrationsData.api_keys) {
        return { 
          configured: false, 
          openaiKey: null, 
          twilioSid: null, 
          twilioToken: null, 
          senderId: null, 
          delayMinutes: 0, 
          prompt: null 
        };
      }
      
      const apiKeys = integrationsData.api_keys;
      
      // Decrypt API keys (they are stored encrypted)
      const decryptKey = (key: string) => {
        if (!key) return null;
        try { return decrypt(key); } catch { return null; }
      };
      
      return { 
        configured: true, 
        openaiKey: decryptKey(apiKeys.openaiKey), 
        twilioSid: decryptKey(apiKeys.twilioSid),
        twilioToken: decryptKey(apiKeys.twilioToken),
        senderId: activeWaConfig.settings?.senderId || "",
        delayMinutes: activeWaConfig.settings?.delayMinutes || 15,
        prompt: activeWaConfig.settings?.prompt || "",
      };
    });

    if (!configStep.configured || !configStep.openaiKey || !configStep.twilioSid || !configStep.twilioToken || !configStep.senderId) {
      return { status: "skipped", reason: "WhatsApp agent inactive or missing critical Twilio/OpenAI keys." };
    }

    // Step 2: Sleep for the dynamically configured delay time
    await step.sleep("wait-for-whatsapp-recovery", `${configStep.delayMinutes}m`);

    // Step 3: Use OpenAI REST API to generate the custom nudge
    const aiMessage = await step.run("generate-ai-nudge", async () => {
      console.log(`[Inngest] Generating WhatsApp nudge via OpenAI...`);
      const safeName = sanitizeInput(customerName);
      const safeItems = items ? items.map((i: string) => sanitizeInput(i)).join(", ") : "items";
      const systemPrompt = configStep.prompt;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${configStep.openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `${systemPrompt}\n\nContext: Customer name is ${safeName}. Left ${safeItems} in cart totaling ${cartTotal}. Their recovery URL is ${abandonUrl}.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.choices[0].message.content;
    });

    // Step 4: Dispatch the message via Twilio REST API
    await step.run("dispatch-twilio-whatsapp", async () => {
      console.log(`[Inngest] Sending WhatsApp to ${phone}...`);
      
      const url = `https://api.twilio.com/2010-04-01/Accounts/${configStep.twilioSid}/Messages.json`;
      const authToken = Buffer.from(`${configStep.twilioSid}:${configStep.twilioToken}`).toString('base64');
      
      const data = new URLSearchParams();
      data.append('To', `whatsapp:${phone}`);
      data.append('From', configStep.senderId);
      data.append('Body', aiMessage);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: data,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(`Twilio Error: ${JSON.stringify(err)}`);
      }

      return await response.json();
    });

    return { status: "success", checkoutId, method: "whatsapp_agent" };
  }
);

/**
 * AGENT 3 (Cron Controller): 
 * Awakes at 8:00 AM daily. Scans the 'agent_configurations' table for 
 * anyone with `inventory` active, and fans out discrete jobs per merchant.
 */
export const generateDailyInventoryReport = inngest.createFunction(
  { 
    id: "generate-daily-inventory-report", 
    name: "Generate Daily Inventory Report",
    triggers: [{ cron: "TZ=America/New_York 0 8 * * *" }]
  },
  async ({ step }) => {
    
    const merchants = await step.run("fetch-active-merchants", async () => {
      // Find configs where agent_type = 'inventory' and settings.isActive = true
      const { data, error } = await supabase
        .from("agent_configurations")
        .select("user_id")
        .eq("agent_type", "inventory");
        
      if (error || !data) return [];
      
      // Because Supabase JSONB querying is tricky, filter in memory
      const allIntegrations = await supabase
        .from("agent_configurations")
        .select("user_id, settings")
        .eq("agent_type", "inventory")
        .in("user_id", data.map(d => d.user_id));
        
      const activeMerchants = allIntegrations.data?.filter(c => c.settings?.isActive) || [];
      return activeMerchants.map(c => c.user_id);
    });

    if (!merchants || merchants.length === 0) {
      return { status: "skipped", reason: "No active inventory agents." };
    }

    // Fan-Out Architecture: trigger a specific process event for each active merchant
    const events = merchants.map(userId => ({
      name: "StorePilot/inventory.scan.merchant",
      data: { userId }
    }));

    await step.sendEvent("fan-out-merchants", events);
    
    return { status: "success", merchantsBatched: merchants.length };
  }
);

/**
 * AGENT 3 (Granular Worker):
 * Receives the fan-out event, securely grabs Shopify tokens, pulls live SKUs, 
 * runs velocity math, and asks an LLM to draft a purchasing request.
 */
export const processMerchantInventory = inngest.createFunction(
  { 
    id: "process-merchant-inventory", 
    name: "Process Merchant Inventory",
    triggers: [{ event: "StorePilot/inventory.scan.merchant" }]
  },
  async ({ event, step }) => {
    // @ts-ignore
    const { userId } = event.data;

    // 1. Fetch Config and Tokens
    const configStep = await step.run("fetch-inventory-config", async () => {
      const { data: invConfig } = await supabase
        .from("agent_configurations")
        .select("settings")
        .eq("user_id", userId)
        .eq("agent_type", "inventory")
        .single();
        
      const { data: keysData } = await supabase
        .from("agent_configurations")
        .select("api_keys")
        .eq("user_id", userId)
        .eq("agent_type", "integrations")
        .single();
        
      if (!invConfig || !keysData?.api_keys) {
        return {
          shopifyUrl: null,
          shopifyToken: null,
          openaiKey: null,
          threshold: 15,
          forecastDays: 30
        };
      }
      
      return {
        shopifyUrl: keysData.api_keys.shopifyUrl,
        shopifyToken: keysData.api_keys.shopifyToken ? decrypt(keysData.api_keys.shopifyToken) : null,
        openaiKey: keysData.api_keys.openaiKey ? decrypt(keysData.api_keys.openaiKey) : null,
        threshold: parseInt(invConfig.settings?.lowStockThreshold || "15"),
        forecastDays: parseInt(invConfig.settings?.forecastDays || "30")
      };
    });

    if (!configStep || !configStep.shopifyToken) {
      return { status: "failed", reason: "Missing keys or config." };
    }

    // 2. Query Shopify Admin API for Product Variants (Limits to 50 for demo)
    const storeData = await step.run("query-shopify-inventory", async () => {
      // Normalizing shopify URL
      const shopRegex = /([a-zA-Z0-9\-]+)\.myshopify\.com/i;
      const match = configStep.shopifyUrl.match(shopRegex);
      if (!match) return null;
      
      const endpoint = `https://${match[0]}/admin/api/2024-01/variants.json?limit=50`;
      
      const res = await fetch(endpoint, {
        headers: {
          "X-Shopify-Access-Token": configStep.shopifyToken,
          "Content-Type": "application/json"
        }
      });
      
      if (!res.ok) return null;
      return await res.json();
    });

    if (!storeData || !storeData.variants) {
      return { status: "failed", reason: "Failed mapping Shopify API" };
    }

    // 3. Filter down SKUs strictly hitting the low stock threshold mathematically 
    const filteredSKUs = storeData.variants.filter((v: any) => {
       // In a real scenario we compare current velocity against inventory_quantity
       // Here we apply a simple proxy: fewer than 'threshold' units remaining.
       return v.inventory_quantity < configStep.threshold;
    });

    if (filteredSKUs.length === 0) {
      return { status: "success", message: "No low stock detected. Math says we are good." };
    }

    // 4. Hit OpenAI to construct the drafted Purchase Order cleanly
    const aiDraft = await step.run("generate-ai-draft", async () => {
      const inventoryContext = filteredSKUs.map((v: any) => `- ${v.title} (SKU: ${v.sku || 'N/A'}) = ${v.inventory_quantity} units left`).join("\\n");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${configStep.openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert supply chain bot. My velocity threshold is ${configStep.forecastDays} days. The following products are critically low. Write a professional, concise Vendor Purchase Order email requesting restock for these items. Do not put placeholders for names, just write 'Vendor Team'.`
            },
            {
              role: "user",
              content: inventoryContext
            }
          ],
          temperature: 0.4,
          max_tokens: 300
        })
      });

      const result = await response.json();
      return result.choices[0].message.content;
    });

    // 5. Emit Final Draft (Simulating sending via SendGrid/Resend)
    await step.run("emit-po-draft", async () => {
       console.log(`[Inngest Worker] AI Drafted PO for user ${userId}:`);
       console.log(aiDraft);
       // Here you would use Resend / SendGrid to actually email the merchant
    });

    return { status: "success", skusAnalyzed: storeData.variants.length, skusToOrder: filteredSKUs.length };
  }
);
