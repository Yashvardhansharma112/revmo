import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      console.error("[Razorpay] RAZORPAY_PLAN_ID missing in environment.");
      return NextResponse.json({ error: "Platform billing not configured." }, { status: 500 });
    }

    // Create a Razorpay Subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles (1 year)
      notes: {
        userId: user.id,
        userEmail: user.email || "",
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("[Razorpay Checkout Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
