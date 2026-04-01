import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { recoverAbandonedCheckout, recoverViaWhatsApp, generateDailyInventoryReport, processMerchantInventory } from "@/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    recoverAbandonedCheckout,
    recoverViaWhatsApp,
    generateDailyInventoryReport,
    processMerchantInventory
  ],
});
