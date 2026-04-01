import { SubscriptionGuard } from "@/components/ui/SubscriptionGuard";
import WhatsAppAgentClient from "./client";

export const metadata = {
  title: "WhatsApp Nudge Agent | Revmo AI",
  description: "Configure your conversational WhatsApp agent.",
};

export default function WhatsAppAgentPaywall() {
  return (
    <SubscriptionGuard>
      <WhatsAppAgentClient />
    </SubscriptionGuard>
  );
}
