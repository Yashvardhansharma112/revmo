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
  "revmo/checkout.abandoned": {
    data: AbandonedCheckoutData;
  };
};

export const inngest = new Inngest({
  id: "revmo",
  name: "Revmo.ai",
});
