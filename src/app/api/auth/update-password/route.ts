import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "New password is required" },
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
      password,
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
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
