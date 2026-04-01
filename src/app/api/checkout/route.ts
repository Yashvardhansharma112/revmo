import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default to the origin or public APP URL
    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // In MVP, we lock to a single tier price ID from ENV
    const priceId = process.env.STRIPE_PRICE_ID; 
    
    if (!priceId) {
      console.error("[Stripe] STRIPE_PRICE_ID missing in environment.");
      return NextResponse.json({ error: "Platform billing not configured." }, { status: 500 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: user.id, // Binds the checkout precisely to the Supabase UUID
      success_url: `${origin}/dashboard?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout_canceled=true`,
      metadata: {
        userId: user.id
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("[Stripe Checkout Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
