import { SubscriptionGuard } from "@/components/ui/SubscriptionGuard";
import InventoryAgentClient from "./client";

export default function InventoryAgentPage() {
  return (
    <SubscriptionGuard>
      <InventoryAgentClient />
    </SubscriptionGuard>
  );
}
