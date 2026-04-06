/**
 * StorePilot Security Logger
 * Centralized logging for security events, authentication attempts, and suspicious activity
 */

export type LogLevel = "info" | "warn" | "error" | "security";

export type SecurityEventType =
  | "auth_login_success"
  | "auth_login_failed"
  | "auth_signup"
  | "auth_logout"
  | "auth_password_reset"
  | "auth_email_verification"
  | "api_access_denied"
  | "api_rate_limited"
  | "api_invalid_request"
  | "webhook_received"
  | "webhook_failed_validation"
  | "suspicious_traffic"
  | "data_access_violation"
  | "configuration_changed"
  | "test_whatsapp_sent"
  | "test_voice_call"
  | "team_invitation_sent";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: SecurityEventType;
  message: string;
  details?: Record<string, unknown>;
  ip?: string;
  userId?: string;
  path?: string;
}

// Security event logger with structured output
export function logSecurityEvent(
  event: SecurityEventType,
  message: string,
  details?: Record<string, unknown>
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: "security",
    event,
    message,
    details: sanitizeLogData(details),
  };

  // In production, this would send to a security logging service
  // For now, output to console with structured format
  console.log(JSON.stringify({
    ...entry,
    // Add correlation ID for tracing
    correlationId: generateCorrelationId(),
  }));
}

// Authentication event logging
export function logAuthEvent(
  type: "login_success" | "login_failed" | "signup" | "logout" | "password_reset",
  email: string,
  success: boolean,
  ip?: string,
  details?: Record<string, unknown>
) {
  const event: SecurityEventType = type === "login_success" 
    ? "auth_login_success" 
    : type === "login_failed"
    ? "auth_login_failed"
    : type === "signup"
    ? "auth_signup"
    : type === "logout"
    ? "auth_logout"
    : "auth_password_reset";

  logSecurityEvent(event, `${type} for ${email}`, {
    success,
    email: maskEmail(email),
    ...details,
  });
}

// API error logging
export function logApiError(
  endpoint: string,
  error: string | Error,
  userId?: string,
  ip?: string
) {
  logSecurityEvent("api_invalid_request", `API error on ${endpoint}`, {
    endpoint,
    error: typeof error === "string" ? error : error.message,
    userId: userId || "anonymous",
    ip: ip ? maskIp(ip) : undefined,
  });
}

// Rate limit event logging
export function logRateLimitEvent(
  identifier: string,
  endpoint: string,
  limit: number,
  windowMs: number
) {
  logSecurityEvent("api_rate_limited", `Rate limit exceeded for ${identifier}`, {
    identifier: maskIp(identifier),
    endpoint,
    limit,
    windowMs,
  });
}

// Suspicious activity detection logging
export function logSuspiciousActivity(
  type: string,
  description: string,
  details?: Record<string, unknown>
) {
  logSecurityEvent("suspicious_traffic", `[${type}] ${description}`, {
    ...details,
    severity: "high",
  });
}

// Data access violation logging (IDOR attempts)
export function logAccessViolation(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  ip?: string
) {
  logSecurityEvent("data_access_violation", `IDOR attempt detected`, {
    userId,
    resourceType,
    resourceId: maskResourceId(resourceId),
    action,
    ip: ip ? maskIp(ip) : undefined,
  });
}

// Webhook event logging
export function logWebhookEvent(
  provider: "shopify" | "stripe" | "twilio" | "inngest",
  eventType: string,
  success: boolean,
  details?: Record<string, unknown>
) {
  const event: SecurityEventType = success 
    ? "webhook_received" 
    : "webhook_failed_validation";

  logSecurityEvent(event, `${provider} webhook: ${eventType}`, {
    provider,
    eventType,
    success,
    ...details,
  });
}

// Configuration change logging
export function logConfigChange(
  userId: string,
  resourceType: string,
  changes: Record<string, unknown>
) {
  logSecurityEvent("configuration_changed", `Configuration updated for ${resourceType}`, {
    userId,
    resourceType,
    changedFields: Object.keys(changes),
  });
}

// Helper: Generate correlation ID for request tracing
function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Sanitize log data to prevent injection
function sanitizeLogData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "string") {
      // Remove newlines and control characters
      sanitized[key] = value.replace(/[\n\r\t]/g, " ").substring(0, 1000);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Helper: Mask email for privacy
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 
    ? local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
    : local;
  return `${maskedLocal}@${domain}`;
}

// Helper: Mask IP address for privacy
function maskIp(ip: string): string {
  // Handle IPv4 and IPv6
  if (ip.includes(".")) {
    // IPv4: mask last octet
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.***`;
  } else if (ip.includes(":")) {
    // IPv6: mask last segment
    const parts = ip.split(":");
    return parts.slice(0, 4).join(":") + ":****";
  }
  return "***";
}

// Helper: Mask resource IDs
function maskResourceId(id: string): string {
  if (id.length <= 8) return "***";
  return id.substring(0, 4) + "****" + id.substring(id.length - 4);
}