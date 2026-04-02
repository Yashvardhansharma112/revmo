// StorePilot.ai Global Security Enforcers
// Handles Prompt Injection Protection and Edge Networking Abuse

// -----------------------------------------------------
// 1. LLM/AI Prompt Injection Sanitization
// -----------------------------------------------------
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";
  
  // Remove brackets, backticks, control characters, and structural quotes
  let sanitized = input
    .replace(/[\[\]{}`'"\\]/g, "")           
    .replace(/[\n\r\t]/g, " ")               
    .slice(0, 150); // Cap length heavily to prevent memory/context overflow attacks

  // Filter for common LLM override terminology
  const blocklist = ["ignore", "instructions", "system", "prompt", "bypass", "override", "context", "developer"];
  for (const word of blocklist) {
    if (sanitized.toLowerCase().includes(word)) {
      return "[Redacted User Input]";
    }
  }

  return sanitized.trim();
}

// -----------------------------------------------------
// 2. In-Memory Rate Limiter (Zero Dependency)
// -----------------------------------------------------
// Note: In a massive multi-server topology (Vercel Edge), Upstash Redis is strictly better.
// However, this provides exceptional protection without asking users for Redis API tokens.

type RateLimitInfo = {
  count: number;
  resetAt: number;
};

// Global cache object mapping IP addresses to active usage windows
const rateLimitCache = new Map<string, RateLimitInfo>();

/**
 * Validates if an IP/Identifier has exceeded the allowed limit within the window.
 * @param identifier Client IP Address or User ID
 * @param limit Max requests allowed
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  
  if (!rateLimitCache.has(identifier)) {
    rateLimitCache.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs };
  }

  const record = rateLimitCache.get(identifier)!;

  // Window expired? Reset it.
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    rateLimitCache.set(identifier, record);
    return { success: true, limit, remaining: limit - 1, reset: record.resetAt };
  }

  // Still inside window, increment usage
  record.count += 1;
  rateLimitCache.set(identifier, record);
  
  return { 
    success: record.count <= limit, 
    limit, 
    remaining: Math.max(0, limit - record.count), 
    reset: record.resetAt 
  };
}

// Automatic Garbage Collection interval (Prevents OOM leaks)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of Array.from(rateLimitCache.entries())) {
      if (now > record.resetAt) {
        rateLimitCache.delete(key);
      }
    }
  }, 60000); // Execute sweep every 1 minute
}
