import { createClient } from "@/lib/supabase/server";
import { UserSettingsClient } from "./client";

export const metadata = {
  title: "Settings | StorePilot",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch the subscription status
  const { data: subData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-4xl max-w-full mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Settings</h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage your account preferences, billing, and subscription features.
        </p>
      </div>
      
      <UserSettingsClient userEmail={user.email || ""} subscription={subData} />
    </div>
  );
}
