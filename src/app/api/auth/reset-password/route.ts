import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError, logSuspiciousActivity } from "@/lib/logger";
import { validateEmail } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Bot detection
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      logSuspiciousActivity("bot_detected", botCheck.reason || "Bot detected on password reset", { 
        path: "/api/auth/reset-password" 
      });
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
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

    // Validate email with strict validation
    const emailValidation = validateEmail(body?.email);

    if (!emailValidation) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    // Rate limit: 2 password resets per hour per email
    const rateLimitResult = await checkRateLimit("password_reset", emailValidation);
    if (!rateLimitResult.success) {
      logSuspiciousActivity("rate_limit_exceeded", "Password reset rate limit exceeded", { 
        email: emailValidation.substring(0, 3) + "***" 
      });
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
        { status: 429 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(emailValidation, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://revmo-nine.vercel.app"}/reset-password`,
    });

    if (error) {
      console.warn(`[Auth] Password reset failed for: ${emailValidation}`, error.message);
    }

    // Always return success to prevent email enumeration
    // Even if email doesn't exist, we don't want to leak that info
    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (err) {
    logApiError("/api/auth/reset-password", err as Error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
