import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, sanitizeInput } from "@/lib/security";
import { logAuthEvent, logApiError, logRateLimitEvent } from "@/lib/logger";

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

    const { email, password, name, plan } = await request.json();

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Server-side password strength enforcement
    const passwordErrors: string[] = [];
    if (password.length < 12) passwordErrors.push("at least 12 characters");
    if (!/[A-Z]/.test(password)) passwordErrors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) passwordErrors.push("one lowercase letter");
    if (!/[0-9]/.test(password)) passwordErrors.push("one number");
    if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push("one special character");
    
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Password must contain: ${passwordErrors.join(", ")}` },
        { status: 400 }
      );
    }

    // Sanitize name to prevent injection in user metadata
    const sanitizedName = sanitizeInput(name, 100);
    if (!sanitizedName || sanitizedName.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ["starter", "growth", "scale"];
    const selectedPlan = validPlans.includes(plan) ? plan : "growth";

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: {
          name: sanitizedName,
          plan: selectedPlan,
        },
        // Supabase will send the confirmation email automatically
        // if email confirmation is enabled in the dashboard
      },
    });

    if (error) {
      logAuthEvent("signup", email, false, ip, { reason: error.message });
      return NextResponse.json(
        { error: "Signup failed. Please try again." },
        { status: 400 }
      );
    }

    // Log successful signup
    logAuthEvent("signup", email, true, ip, { userId: data.user?.id, plan: selectedPlan });

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
