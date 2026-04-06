import { Inngest } from "inngest";
import { CampaignStep, RecipientStatus } from "@/types/marketing";

type AbandonedCheckoutData = {
  shopDomain: string;
  checkoutId: string;
  phone: string;
  customerName: string;
  cartTotal: string | number;
  abandonUrl: string;
  items: string[];
  /** Required: merchant's Supabase user ID — scopes all DB queries (IDOR prevention) */
  userId: string;
};

// Inngest v4 event map — plain record, typed at the Inngest instance level via generics
export type InnguestEvents = {
  "StorePilot/checkout.abandoned": {
    data: AbandonedCheckoutData;
  };
  "StorePilot/inventory.scan.merchant": {
    data: { userId: string };
  };
  "marketing/campaign.triggered": {
    data: { campaignId: string; userId: string };
  };
  "marketing/recipient.process": {
    data: { 
      campaignId: string; 
      recipientId: string; 
      variantId: string; 
      userId: string;
      stepIndex: number;
    };
  };
};

export const inngest = new Inngest({
  id: "StorePilot",
  name: "StorePilot.ai",
  eventKey: process.env.INNGEST_EVENT_KEY,
  schemas: {} as InnguestEvents,
});
