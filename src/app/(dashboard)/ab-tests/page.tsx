import { SubscriptionGuard } from "@/components/ui/SubscriptionGuard";
import ABTestsClient from "./client";

export const metadata = {
  title: "A/B Tests | StorePilot AI",
  description: "Create and monitor A/B experiments across your AI agents.",
};

export default function ABTestsPage() {
  return (
    <SubscriptionGuard>
      <ABTestsClient />
    </SubscriptionGuard>
  );
}
