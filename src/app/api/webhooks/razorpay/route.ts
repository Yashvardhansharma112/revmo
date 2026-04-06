import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { razorpay } from "@/lib/razorpay";

// We need a Service Role client to bypass RLS for webhooks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(bodyText)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(bodyText);

    if (event.event === "subscription.charged" || event.event === "subscription.activated") {
      const subscription = event.payload.subscription.entity;
      const payment = event.payload.payment?.entity;
      
      const userId = subscription.notes?.userId;
      
      if (userId) {
         await supabase.from("subscriptions").upsert({
            user_id: userId,
            provider: "razorpay",
            provider_customer_id: payment?.customer_id || null,
            provider_subscription_id: subscription.id,
            status: subscription.status, // "active", "completed", "cancelled"
            plan_id: subscription.plan_id,
            current_period_end: new Date(subscription.current_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_cycle_end || false,
         }, { onConflict: "user_id" });
      }
    }

    if (event.event === "subscription.cancelled" || event.event === "subscription.halted") {
       const subscription = event.payload.subscription.entity;
       
       await supabase.from("subscriptions").update({
          status: subscription.status,
          cancel_at_period_end: true
       }).eq("provider_subscription_id", subscription.id);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
