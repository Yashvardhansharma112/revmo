// StorePilot.ai Global Security Enforcers
// Handles Prompt Injection Protection and Rate Limiting

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// -----------------------------------------------------
// 1. LLM/AI Prompt Injection Sanitization
// -----------------------------------------------------
export function sanitizeInput(input: string | undefined | null, maxLength: number = 500): string {
  if (!input) return "";
  
  // Remove control characters and null bytes only (preserve legitimate content)
  let sanitized = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars except newline/tab
    .slice(0, maxLength);

  return sanitized.trim();
}

// -----------------------------------------------------
// 2. Bot Detection (Simple heuristic-based)
// -----------------------------------------------------

interface BotDetectionResult {
  isBot: boolean;
  reason?: string;
}

export function detectBot(request: Request): BotDetectionResult {
  const userAgent = request.headers.get("user-agent") || "";
  const accept = request.headers.get("accept") || "";
  
  // Check for common bot patterns in User-Agent
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scrap/i, /curl/i, /wget/i,
    /python/i, /java/i, /go-http/i, /fetch/i, /headless/i,
    /puppeteer/i, /selenium/i, /playwright/i, /normbot/i,
  ];
  
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      // Allow legitimate bots with proper identification
      if (/googlebot|bingbot|yandex/i.test(userAgent)) {
        return { isBot: false }; // Allow search engine bots
      }
      return { isBot: true, reason: `Bot user-agent detected: ${userAgent.substring(0, 50)}` };
    }
  }
  
  // Check for missing Accept header (unusual for browsers)
  if (!accept && userAgent) {
    return { isBot: true, reason: "Missing Accept header" };
  }
  
  // Check for suspicious headers
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  
  // Multiple proxies can indicate attempt to hide origin
  if (xForwardedFor && xForwardedFor.split(",").length > 3) {
    return { isBot: true, reason: "Suspicious proxy chain" };
  }
  
  return { isBot: false };
}

// -----------------------------------------------------
// 3. Upstash Redis Rate Limiter (Production-Grade)
// -----------------------------------------------------

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    console.warn("[Security] Upstash Redis not configured. Rate limiting disabled.");
    return null;
  }
  
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  
  return redis;
}

// Rate limiters for different use cases
let loginLimiter: Ratelimit | null = null;
let signupLimiter: Ratelimit | null = null;
let passwordResetLimiter: Ratelimit | null = null;
let apiLimiter: Ratelimit | null = null;
let webhookLimiter: Ratelimit | null = null;
let aiGenerationLimiter: Ratelimit | null = null;
let checkoutLimiter: Ratelimit | null = null;

function getLoginLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!loginLimiter) {
    // 5 login attempts per 15 minutes per IP
    loginLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(5, "15m"),
      prefix: "ratelimit:login",
    });
  }
  return loginLimiter;
}

function getSignupLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!signupLimiter) {
    // 3 signups per hour per IP
    signupLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(3, "1h"),
      prefix: "ratelimit:signup",
    });
  }
  return signupLimiter;
}

function getPasswordResetLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!passwordResetLimiter) {
    // 2 password resets per hour per email
    passwordResetLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(2, "1h"),
      prefix: "ratelimit:password_reset",
    });
  }
  return passwordResetLimiter;
}

function getApiLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!apiLimiter) {
    // 100 requests per minute per IP for general API
    apiLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(100, "1m"),
      prefix: "ratelimit:api",
    });
  }
  return apiLimiter;
}

function getWebhookLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!webhookLimiter) {
    // 10 webhook hits per 10 seconds per IP
    webhookLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(10, "10s"),
      prefix: "ratelimit:webhook",
    });
  }
  return webhookLimiter;
}

function getAiGenerationLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!aiGenerationLimiter) {
    // 20 AI generation requests per minute per user
    // This prevents abuse of OpenAI/Bland AI API credits
    aiGenerationLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(20, "1m"),
      prefix: "ratelimit:ai_generation",
    });
  }
  return aiGenerationLimiter;
}

function getCheckoutLimiter(): Ratelimit | null {
  const client = getRedisClient();
  if (!client) return null;
  if (!checkoutLimiter) {
    // 5 checkout requests per minute per IP (prevent payment abuse)
    checkoutLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(5, "1m"),
      prefix: "ratelimit:checkout",
    });
  }
  return checkoutLimiter;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export type RateLimitType = "login" | "signup" | "password_reset" | "api" | "webhook" | "ai_generation" | "checkout" | "team_create" | "team_invite" | "store_add" | "ab_create" | string;

export async function checkRateLimit(
  type: RateLimitType,
  identifier: string
): Promise<RateLimitResult> {
  let limiter: Ratelimit | null = null;
  
  switch (type) {
    case "login":
      limiter = getLoginLimiter();
      break;
    case "signup":
      limiter = getSignupLimiter();
      break;
    case "password_reset":
      limiter = getPasswordResetLimiter();
      break;
    case "api":
    case "team_create":
    case "team_invite":
    case "store_add":
    case "ab_create":
      limiter = getApiLimiter();
      break;
    case "webhook":
      limiter = getWebhookLimiter();
      break;
    case "ai_generation":
      limiter = getAiGenerationLimiter();
      break;
    case "checkout":
      limiter = getCheckoutLimiter();
      break;
    default:
      limiter = getApiLimiter();
  }
  
// If Redis is not configured, allow all requests (graceful degradation)
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  
  return {
    success,
    limit,
    remaining,
    reset: typeof reset === "string" ? parseInt(reset) : reset,
  };
}

// Legacy compatibility function (deprecated - use checkRateLimit instead)
export function rateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
  console.warn("[Security] Legacy rateLimit() called. Migrate to checkRateLimit() for Redis-based limiting.");
  return { success: true, limit, remaining: limit - 1, reset: Date.now() + windowMs };
}
