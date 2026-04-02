import { SubscriptionGuard } from "@/components/ui/SubscriptionGuard";
import IntegrationsClient from "./client";

export const metadata = {
  title: "Integrations | StorePilot AI",
  description: "Configure third-party API configurations for SaaS operations.",
};

export default function IntegrationsPaywall() {
  return (
    // Only paying merchants can access the underlying vault integration systems
    <SubscriptionGuard>
      <IntegrationsClient />
    </SubscriptionGuard>
  );
}
