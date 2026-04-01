import { SubscriptionGuard } from "@/components/ui/SubscriptionGuard";
import VoiceAgentClient from "./client";

export const metadata = {
  title: "Voice Agent Defaults | Revmo AI",
  description: "Configure your Voice AI personas.",
};

export default function VoiceAgentPaywall() {
  return (
    // Exclusively available to users holding an active Stripe Subscripton
    <SubscriptionGuard>
      <VoiceAgentClient />
    </SubscriptionGuard>
  );
}
