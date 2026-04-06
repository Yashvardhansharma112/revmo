import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Allowed redirect paths - prevents open redirect attacks
const ALLOWED_REDIRECT_PATHS = ["/dashboard", "/settings", "/agents", "/analytics", "/customers", "/campaigns", "/automation", "/integrations", "/inbox"];

function isSafeRedirect(path: string): boolean {
  // Must start with single / (not //) and be in allowed paths
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Strip query params for path comparison
  const cleanPath = path.split("?")[0];
  return ALLOWED_REDIRECT_PATHS.some(allowed => cleanPath === allowed || cleanPath.startsWith(allowed + "/"));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  if (error) {
    // Handle OAuth errors securely - don't leak details
    const errorRedirect = new URL("/login", origin);
    errorRedirect.searchParams.set("error", "auth_failed");
    return NextResponse.redirect(errorRedirect.toString());
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      // Validate redirect target to prevent open redirect attacks
      const safeNext = isSafeRedirect(next) ? next : "/dashboard";
      return NextResponse.redirect(new URL(safeNext, origin));
    }
    
    // Log error internally but don't expose details to client
    console.error("[Auth Callback] Session exchange failed:", exchangeError.message);
  }

  // Return the user to login with generic error - never expose internal details
  return NextResponse.redirect(new URL("/login?error=auth_failed", origin));
}
