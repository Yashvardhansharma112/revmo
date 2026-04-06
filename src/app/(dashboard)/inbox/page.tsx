import { Metadata } from "next";
import InboxClient from "./client";

export const metadata: Metadata = {
  title: "Inbox | Revmo",
  description: "Manage conversations and AI agent threads.",
};

export default function InboxPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-4 p-8 pb-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inbox</h2>
          <p className="text-muted-foreground">
            Manage conversations and AI agent threads across WhatsApp, Voice, and SMS.
          </p>
        </div>
      </div>
      <div className="flex-1 px-8 pb-8 overflow-hidden">
        <InboxClient />
      </div>
    </div>
  );
}
