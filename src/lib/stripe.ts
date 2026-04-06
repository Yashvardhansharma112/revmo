import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";

if (!secretKey) {
  console.warn("⚠️ STRIPE_SECRET_KEY is missing from environment variables. Billing functions will fail.");
}

export const stripe = new Stripe(secretKey, {
  // Use a generic recent API version; adjust as needed for strict typing.
  apiVersion: "2024-06-20" as any, 
  appInfo: {
    name: 'StorePilot.ai',
    version: '0.1.0',
  },
});
