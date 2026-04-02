import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Admin Supabase client — bypasses RLS for server-side writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  // Verify Razorpay webhook signature (HMAC SHA256)
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("⚠️ Razorpay webhook signature verification failed.");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const { event: eventType, payload } = event;

  try {
    switch (eventType) {
      // Subscription activated / payment captured
      case "subscription.activated":
      case "payment.captured": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        const userId = subscription.notes?.userId;
        if (!userId) {
          console.error("[Razorpay Webhook] Missing userId in subscription notes.");
          break;
        }

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .upsert({
            user_id: userId,
            stripe_customer_id: subscription.customer_id || subscription.id, // reuse column for Razorpay customer
            stripe_subscription_id: subscription.id,
            status: subscription.status === "active" ? "active" : subscription.status,
            price_id: subscription.plan_id || "unknown",
            current_period_end: subscription.current_end
              ? new Date(subscription.current_end * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

        if (error) throw error;
        console.log(`[Razorpay] Subscription activated for user ${userId}`);
        break;
      }

      // Subscription cancelled or expired
      case "subscription.cancelled":
      case "subscription.completed": {
        const subscription = payload.subscription?.entity;
        if (!subscription) break;

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status: eventType === "subscription.cancelled" ? "canceled" : "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) throw error;
        console.log(`[Razorpay] Subscription ${eventType} for sub ${subscription.id}`);
        break;
      }

      default:
        console.log(`[Razorpay Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (err: any) {
    console.error(`[Razorpay Webhook] Error processing event:`, err.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
