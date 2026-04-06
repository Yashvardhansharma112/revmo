import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validatePassword } from "@/lib/validation";
import { logApiError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
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

    // Validate password with strict validation
    const passwordValidation = validatePassword(body?.password);

    if (!passwordValidation) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters with uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Verify user is authenticated (updatePassword requires active session)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to update your password" },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({
      password: passwordValidation,
    });

    if (error) {
      console.warn(`[Auth] Password update failed for user: ${user.id}`, error.message);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (err) {
    logApiError("/api/auth/update-password", err as Error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
