import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security";
import { logAuthEvent, logApiError, logRateLimitEvent } from "@/lib/logger";
import { validateEmail, validateString, validateApiInput } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    
    // Rate limit: 5 login attempts per 15 minutes per IP
    const rateLimitResult = await checkRateLimit("login", ip);
    if (!rateLimitResult.success) {
      logRateLimitEvent(ip, "/api/auth/login", rateLimitResult.limit, 900000);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Validate inputs with strict validation
    const emailValidation = validateEmail(body?.email);
    const passwordValidation = validateString(body?.password, {
      minLength: 1,
      maxLength: 128,
    });

    if (!emailValidation) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!passwordValidation) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailValidation,
      password: passwordValidation,
    });

    if (error) {
      // Log failed authentication attempt
      logAuthEvent("login_failed", emailValidation, false, ip, { reason: error.message });
      
      // Never expose whether email exists or specific error details
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user's email is confirmed
    if (!data.user?.email_confirmed_at) {
      logAuthEvent("login_failed", emailValidation, false, ip, { reason: "email_not_verified" });
      return NextResponse.json(
        { error: "Please verify your email before logging in", needsVerification: true },
        { status: 403 }
      );
    }

    // Log successful authentication
    logAuthEvent("login_success", emailValidation, true, ip, { userId: data.user.id });

    // Successful login - return minimal user info
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    logApiError("/api/auth/login", err as Error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
