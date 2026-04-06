import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// We need a Service Role client to bypass RLS for webhooks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  
  if (event.type === "checkout.session.completed") {
    // Retrieve the subscription details from Stripe
    const subscription = (await stripe.subscriptions.retrieve(
      session.subscription as string
    )) as Stripe.Subscription;

    const userId = session.client_reference_id || session.metadata?.userId;

    if (userId) {
      // Create or update subscription
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        provider: "stripe",
        provider_customer_id: subscription.customer as string,
        provider_subscription_id: subscription.id,
        status: subscription.status,
        plan_id: (subscription as any).items?.data[0]?.price?.id || "unknown",
        current_period_end: new Date(((subscription as any).current_period_end || 0) * 1000).toISOString(),
        cancel_at_period_end: (subscription as any).cancel_at_period_end || false,
      }, { onConflict: "user_id" });
    }
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as any;
    const subscriptionId = invoice.subscription as string;
    
    // Update subscription period
    const { data: sub } = await supabase.from("subscriptions")
      .select("id")
      .eq("provider_subscription_id", subscriptionId)
      .single();

    if (sub) {
      await stripe.subscriptions.retrieve(subscriptionId).then(async (res) => {
        const s = res as Stripe.Subscription;
        await supabase.from("subscriptions").update({
          status: s.status,
          current_period_end: new Date(((s as any).current_period_end || 0) * 1000).toISOString()
        }).eq("id", sub.id);
      });
    }
  }
  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subAny = event.data.object as any;
    
    await supabase.from("subscriptions").update({
      status: subAny.status,
      plan_id: subAny.items?.data[0]?.price?.id || "unknown",
      current_period_end: new Date((subAny.current_period_end || 0) * 1000).toISOString(),
      cancel_at_period_end: subAny.cancel_at_period_end || false,
    }).eq("provider_subscription_id", subAny.id);
  }

  return NextResponse.json({ received: true });
}
