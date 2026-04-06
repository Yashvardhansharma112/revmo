import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logSuspiciousActivity, logApiError } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    // Bot detection
    const botCheck = detectBot(req);
    if (botCheck.isBot) {
      logSuspiciousActivity("bot_detected", botCheck.reason || "Unknown bot", { 
        path: "/api/checkout",
        userAgent: req.headers.get("user-agent") 
      });
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    // Rate limit: 5 checkout requests per minute per IP
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("checkout", ip);
    if (!rateLimitResult.success) {
      logSuspiciousActivity("rate_limit_exceeded", "Checkout rate limit exceeded", { 
        ip, 
        limit: rateLimitResult.limit 
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        }
      );
    }

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
    logApiError("/api/checkout", error as Error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
