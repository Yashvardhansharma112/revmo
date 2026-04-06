import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError, logSecurityEvent } from "@/lib/logger";
import { validateEmail, validateString } from "@/lib/validation";
import { randomBytes } from "crypto";

// GET - List team members
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("team_id");

  if (!teamId) {
    return NextResponse.json({ error: "team_id required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Get members
    const { data: members } = await supabase
      .from("team_members")
      .select(`
        *,
        user:user_profiles(email, full_name, avatar_url)
      `)
      .eq("team_id", teamId);

    return NextResponse.json({ members: members || [] });
  } catch (err) {
    logApiError("/api/team/members", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Invite member or add member
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("team_invite", ip);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { team_id, email, role, user_id } = body;

    if (!team_id) {
      return NextResponse.json({ error: "team_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: membership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", team_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Invite by email
    if (email) {
      const emailValidation = validateEmail(email);
      if (!emailValidation) {
        return NextResponse.json({ error: "Invalid email" }, { status: 400 });
      }

      const validRole = ["admin", "member", "viewer"].includes(role) ? role : "member";
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: invitation, error } = await supabase
        .from("team_invitations")
        .insert({
          team_id,
          email: emailValidation,
          role: validRole,
          invited_by: user.id,
          token,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      logSecurityEvent("team_invitation_sent", `Invitation sent to ${emailValidation}`);
      return NextResponse.json({
        invitation: { email, role: validRole, expires_at: expiresAt },
        token,
      });
    }

    // Add existing user directly
    if (user_id) {
      const validRole = ["admin", "member", "viewer"].includes(role) ? role : "member";

      const { error } = await supabase.from("team_members").insert({
        team_id,
        user_id,
        role: validRole,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "email or user_id required" }, { status: 400 });
  } catch (err) {
    logApiError("/api/team/members", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove member
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("member_id");
  const invitationId = searchParams.get("invitation_id");

  if (!memberId && !invitationId) {
    return NextResponse.json({ error: "member_id or invitation_id required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get membership
    let membership;
    if (memberId) {
      const { data } = await supabase
        .from("team_members")
        .select("team_id, role, user_id")
        .eq("id", memberId)
        .single();
      membership = data;
    }

    if (!membership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Check permissions (owner or admin can remove)
    const { data: userMembership } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", membership.team_id)
      .eq("user_id", user.id)
      .single();

    if (!userMembership || !["owner", "admin"].includes(userMembership.role)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // Can't remove owner
    if (membership.role === "owner") {
      return NextResponse.json({ error: "Cannot remove owner" }, { status: 400 });
    }

    // Can't self-remove if not admin/owner
    if (membership.user_id === user.id && userMembership.role !== "owner") {
      return NextResponse.json({ error: "Cannot leave team as non-owner" }, { status: 400 });
    }

    // Remove member
    if (memberId) {
      await supabase.from("team_members").delete().eq("id", memberId);
    }

    // Remove invitation
    if (invitationId) {
      await supabase.from("team_invitations").delete().eq("id", invitationId);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logApiError("/api/team/members", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}