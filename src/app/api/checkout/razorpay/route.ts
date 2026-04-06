import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const botCheck = detectBot(req);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit("checkout", user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const planId = process.env.RAZORPAY_PLAN_ID;
    if (!planId) {
      return NextResponse.json({ error: "Razorpay not configured yet" }, { status: 500 });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12,
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
    console.error("Razorpay Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
