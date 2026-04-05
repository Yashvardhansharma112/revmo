import { Inngest, EventPayload } from "inngest";

type AbandonedCheckoutData = {
  shopDomain: string;
  checkoutId: string;
  phone: string;
  customerName: string;
  cartTotal: string | number;
  abandonUrl: string;
  items: string[];
};

type Events = {
  "StorePilot/checkout.abandoned": {
    data: AbandonedCheckoutData;
  };
};

export const inngest = new Inngest({
  id: "StorePilot",
  name: "StorePilot.ai",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
