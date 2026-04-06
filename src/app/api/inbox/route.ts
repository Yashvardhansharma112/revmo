import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Fetch messages for a specific conversation
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return NextResponse.json(messages);
    } else {
      // Fetch all conversations for the user
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return NextResponse.json(conversations);
    }
  } catch (error: any) {
    console.error("Inbox API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, content } = body;

    if (!conversationId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the manual takeover message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        direction: "outbound",
        role: "agent",
        content,
        status: "sent",
      })
      .select()
      .single();

    if (error) throw error;

    // Update the conversation's last message timestamp
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conversationId);

    return NextResponse.json(message);
  } catch (error: any) {
    console.error("Inbox POST API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
