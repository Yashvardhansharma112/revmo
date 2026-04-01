import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash env vars are present (fallback elegantly for local testing)
const hasUpstashKeys = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstashKeys ? new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
}) : null;

// Global API Limiter: 20 requests per 10 seconds (prevents backend scraping and AI quota burning)
const apiLimiter = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "10 s"),
  ephemeralCache: new Map(), // Vercel edge fast cache
  analytics: true,
}) : null;

// Webhook Limiter: 10 requests per 5 seconds (prevents massive spike injections)
const webhookLimiter = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "5 s"),
  ephemeralCache: new Map(),
  analytics: true,
}) : null;

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const path = request.nextUrl.pathname;

  // We only rate limit the /api routes
  if (path.startsWith("/api/")) {
    
    // If no Upstash keys, bypass Edge rate limiting (the fallback local memory limiters inside specific routes will trigger instead).
    if (!redis) {
      if (process.env.NODE_ENV === "production") {
        console.warn("⚠️ Production WARNING: UPSTASH_REDIS_REST_URL is missing. Edge DDoS protection is disabled! Falling back to local Map algorithms.");
      }
      return NextResponse.next();
    }

    try {
      if (path.startsWith("/api/webhooks")) {
        // Stricter limiter for public webhook gateways
        const { success, limit, remaining, reset } = await webhookLimiter!.limit(`webhooks_${ip}`);
        if (!success) {
          return new NextResponse(JSON.stringify({ error: "Rate Limit Exceeded" }), {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
              "Content-Type": "application/json"
            }
          });
        }
      } else {
        // Standard Private API limiter (e.g. integrations save, agent provisioning)
        const { success, limit, remaining, reset } = await apiLimiter!.limit(`api_${ip}`);
        if (!success) {
          return new NextResponse(JSON.stringify({ error: "Too Many Requests" }), { 
            status: 429,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    } catch (e) {
      // If the Upstash network goes down, we "fail open" so your business logic doesn't crash
      console.error("[Middleware] Upstash Rate Limit network error - bypassing:", e);
    }
  }

  return NextResponse.next();
}

// Maximize performance: Ensure middleware ONLY fires on /api routes, skipping CSS, images, and static HTML
export const config = {
  matcher: '/api/:path*',
};
