import CampaignsClient from "./client";

export const metadata = {
  title: "AI Campaigns | StorePilot",
  description: "Create and manage your AI-driven outreach campaigns.",
};

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Campaign Builder</h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Launch targeted WhatsApp and Voice outreach campaigns.
          </p>
        </div>
      </div>

      <CampaignsClient />
    </div>
  );
}
