import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, sanitizeInput } from "@/lib/security";
import { logAuthEvent, logApiError, logRateLimitEvent } from "@/lib/logger";
import { validateEmail, validatePassword, validateString } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    
    // Rate limit: 3 signups per hour per IP
    const rateLimitResult = await checkRateLimit("signup", ip);
    if (!rateLimitResult.success) {
      logRateLimitEvent(ip, "/api/auth/signup", rateLimitResult.limit, 3600000);
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
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

    // Validate all inputs with strict validation
    const emailValidation = validateEmail(body?.email);
    const passwordValidation = validatePassword(body?.password);
    const nameValidation = validateString(body?.name, {
      minLength: 2,
      maxLength: 100,
      stripHtml: true,
    });

    if (!emailValidation) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!passwordValidation) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters with uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    if (!nameValidation) {
      return NextResponse.json(
        { error: "Name must be 2-100 characters" },
        { status: 400 }
      );
    }

    // Validate plan if provided
    const validPlans = ["starter", "growth", "scale"];
    const selectedPlan = validPlans.includes(body?.plan) ? body.plan : "growth";

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: emailValidation,
      password: passwordValidation,
      options: {
        data: {
          name: nameValidation,
          plan: selectedPlan,
        },
      },
    });

    if (error) {
      logAuthEvent("signup", emailValidation, false, ip, { reason: error.message });
      return NextResponse.json(
        { error: "Signup failed. Please try again." },
        { status: 400 }
      );
    }

    // Log successful signup
    logAuthEvent("signup", emailValidation, true, ip, { userId: data.user?.id, plan: selectedPlan });

    // Return success - user needs to verify email
    return NextResponse.json({
      success: true,
      needsEmailVerification: true,
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (err) {
    logApiError("/api/auth/signup", err as Error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
