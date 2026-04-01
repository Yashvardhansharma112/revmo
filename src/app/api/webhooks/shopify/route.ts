import { NextResponse } from "next/server";
import crypto from "crypto";
import { inngest } from "@/inngest/client";
import { rateLimit } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-shopify-hmac-sha256");
    const topic = req.headers.get("x-shopify-topic");
    const shopDomain = req.headers.get("x-shopify-shop-domain");

    // Retrieve IP for Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown_ip";
    
    // Webhook Limiter: 5 maximum hits per 10 seconds per IP, blocks DDoS abuse
    const { success, remaining, reset } = rateLimit(`webhook_${ip}`, 5, 10000);
    
    if (!success) {
      console.warn(`[Security] Shopify Webhook throttled IP: ${ip}`);
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429, headers: { 'X-RateLimit-Reset': reset.toString() } });
    }

    // In a production app, the SHOPIFY_WEBHOOK_SECRET should be securely 
    // configured or fetched based on the specific shop installation.
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (secret && signature) {
      const generatedHash = crypto
        .createHmac("sha256", secret)
        .update(rawBody, "utf8")
        .digest("base64");

      if (generatedHash !== signature) {
        return NextResponse.json({ error: "Invalid HMAC signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);

    // Trigger on checkout abandonment
    if (topic === "checkouts/create" || topic === "checkouts/update") {
      
      const phone = payload.customer?.phone || payload.billing_address?.phone || payload.shipping_address?.phone;
      const checkoutId = payload.id;
      const abandonUrl = payload.abandoned_checkout_url;
      const cartTotal = payload.total_price;

      if (!phone) {
        console.warn(`[Shopify Webhook] Checkout ${checkoutId} has no phone number. Skipping Inngest event.`);
        return NextResponse.json({ message: "No phone number, skipped." });
      }

      await inngest.send({
        name: "revmo/checkout.abandoned",
        data: {
          shopDomain: shopDomain || "unknown",
          checkoutId: String(checkoutId),
          phone: phone,
          customerName: payload.customer?.first_name || "Customer",
          cartTotal: cartTotal,
          abandonUrl: abandonUrl,
          items: (payload.line_items || []).map((item: any) => item.title),
        },
      });

      return NextResponse.json({ message: "Dispatched revmo/checkout.abandoned to Inngest queue." });
    }

    return NextResponse.json({ message: `Received ${topic} but unhandled.` });
  } catch (error: any) {
    console.error("Shopify Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
