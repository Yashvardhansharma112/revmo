/**
 * StorePilot Input Validation Library
 * Comprehensive validation and sanitization for all user inputs
 */

import { NextResponse } from "next/server";

// -----------------------------------------------------
// 1. Input Validation Utilities
// -----------------------------------------------------

/**
 * Validates and sanitizes a string input
 */
export function validateString(
  input: unknown,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowEmpty?: boolean;
    stripHtml?: boolean;
    trim?: boolean;
  } = {}
): string | null {
  const {
    minLength = 0,
    maxLength = 10000,
    pattern,
    allowEmpty = false,
    stripHtml = false,
    trim = true,
  } = options;

  if (input === undefined || input === null) {
    return allowEmpty ? "" : null;
  }

  let value = String(input);

  if (trim) {
    value = value.trim();
  }

  // Check min length
  if (!allowEmpty && value.length < minLength) {
    return null;
  }

  // Check max length
  if (value.length > maxLength) {
    value = value.substring(0, maxLength);
  }

  // Strip HTML tags if requested
  if (stripHtml) {
    value = value.replace(/<[^>]*>/g, "");
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    return null;
  }

  return value;
}

/**
 * Validates an email address
 */
export function validateEmail(email: unknown): string | null {
  if (!email) return null;
  
  const emailStr = String(email).toLowerCase().trim();
  
  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(emailStr) || emailStr.length > 254) {
    return null;
  }
  
  return emailStr;
}

/**
 * Validates a password according to security requirements
 */
export function validatePassword(password: unknown): string | null {
  if (!password) return null;
  
  const passwordStr = String(password);
  
  // Minimum 12 characters
  if (passwordStr.length < 12 || passwordStr.length > 128) {
    return null;
  }
  
  // Must contain uppercase, lowercase, number, and special character
  if (!/[A-Z]/.test(passwordStr)) return null;
  if (!/[a-z]/.test(passwordStr)) return null;
  if (!/[0-9]/.test(passwordStr)) return null;
  if (!/[^A-Za-z0-9]/.test(passwordStr)) return null;
  
  // Check for common weak passwords
  const weakPasswords = [
    "password", "123456", "qwerty", "admin", "letmein",
    "welcome", "monkey", "dragon", "master", "login"
  ];
  const lower = passwordStr.toLowerCase();
  if (weakPasswords.some(wp => lower.includes(wp))) {
    return null;
  }
  
  return passwordStr;
}

/**
 * Validates a phone number (E.164 format for WhatsApp)
 */
export function validatePhoneNumber(phone: unknown): string | null {
  if (!phone) return null;
  
  const phoneStr = String(phone).replace(/\s+/g, "");
  
  // Allow formats: +1234567890, whatsapp:+1234567890, 1234567890
  const phoneRegex = /^(\+?[1-9]\d{1,14}|whatsapp:\+?[1-9]\d{1,14})$/;
  
  if (!phoneRegex.test(phoneStr)) {
    return null;
  }
  
  return phoneStr;
}

/**
 * Validates a URL
 */
export function validateUrl(url: unknown): string | null {
  if (!url) return null;
  
  try {
    const urlStr = String(url).trim();
    const parsed = new URL(urlStr);
    
    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    
    // Disallow localhost in production (checked separately)
    return urlStr;
  } catch {
    return null;
  }
}

/**
 * Validates an integer within a range
 */
export function validateInteger(
  value: unknown,
  min: number = 0,
  max: number = Number.MAX_SAFE_INTEGER
): number | null {
  const num = Number(value);
  
  if (!Number.isInteger(num) || num < min || num > max) {
    return null;
  }
  
  return num;
}

/**
 * Validates JSON object with schema validation
 */
export function validateJsonObject(
  input: unknown,
  allowedKeys?: string[],
  maxDepth: number = 5,
  currentDepth: number = 0
): Record<string, unknown> | null {
  if (currentDepth > maxDepth) return null;
  
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return null;
  }
  
  const result: Record<string, unknown> = {};
  const obj = input as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(obj)) {
    // Validate key
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      continue; // Skip invalid keys
    }
    
    // Check allowed keys if specified
    if (allowedKeys && !allowedKeys.includes(key)) {
      continue;
    }
    
    // Recursively validate nested objects
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nested = validateJsonObject(value, undefined, maxDepth, currentDepth + 1);
      if (nested === null) {
        continue; // Skip invalid nested objects
      }
      result[key] = nested;
    } else if (value !== null && value !== undefined) {
      // Primitive values - sanitize strings
      if (typeof value === "string") {
        result[key] = value.substring(0, 5000); // Limit string length
      } else if (typeof value === "number" && Number.isFinite(value)) {
        result[key] = value;
      } else if (typeof value === "boolean") {
        result[key] = value;
      }
      // Skip other types
    }
  }
  
  return result;
}

// -----------------------------------------------------
// 2. Sanitization Utilities
// -----------------------------------------------------

/**
 * Sanitizes input to prevent XSS attacks
 */
export function sanitizeXss(input: unknown): string {
  if (input === null || input === undefined) return "";
  
  const str = String(input);
  
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strips all HTML tags from input
 */
export function stripHtml(input: unknown): string {
  if (!input) return "";
  return String(input).replace(/<[^>]*>/g, "");
}

/**
 * Normalizes whitespace and removes control characters
 */
export function normalizeWhitespace(input: unknown): string {
  if (!input) return "";
  
  return String(input)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control chars
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

// -----------------------------------------------------
// 3. API Input Parser with Validation
// -----------------------------------------------------

interface ValidationRule {
  field: string;
  validate: (value: unknown) => string | null;
  required?: boolean;
}

/**
 * Parses and validates JSON body with schema
 */
export function validateBody(
  body: unknown,
  rules: ValidationRule[]
): { valid: boolean; data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};
  
  for (const rule of rules) {
    const value = (body as Record<string, unknown>)?.[rule.field];
    
    if (rule.required && (value === undefined || value === null)) {
      errors.push(`${rule.field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      const validated = rule.validate(value);
      
      if (validated === null) {
        errors.push(`${rule.field} is invalid`);
      } else {
        data[rule.field] = validated;
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    data,
    errors,
  };
}

/**
 * Helper to create a validated API response
 */
export function validateApiInput(
  data: unknown,
  rules: ValidationRule[]
): NextResponse | null {
  const result = validateBody(data, rules);
  
  if (!result.valid) {
    return NextResponse.json(
      { error: `Invalid input: ${result.errors.join(", ")}` },
      { status: 400 }
    );
  }
  
  return null; // Valid - continue processing
}