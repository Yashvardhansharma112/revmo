import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

if (!keyId || !keySecret) {
  console.warn("⚠️  RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing. Billing functions will fail.");
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});
