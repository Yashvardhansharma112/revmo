import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateEmail, validateString } from "@/lib/validation";

// GET - List user's teams and members
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's teams
    const { data: memberships } = await supabase
      .from("team_members")
      .select(`
        *,
        team:teams(*)
      `)
      .eq("user_id", user.id);

    const teams = memberships?.map(m => ({
      ...m.team,
      role: m.role,
      joined_at: m.joined_at,
    })) || [];

    return NextResponse.json({ teams });
  } catch (err) {
    logApiError("/api/team", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new team
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown_ip";
    const rateLimitResult = await checkRateLimit("team_create", ip);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name } = body;
    const nameValidation = validateString(name, { minLength: 1, maxLength: 100 });
    if (!nameValidation) {
      return NextResponse.json({ error: "Team name is required (1-100 chars)" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create team and add owner
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({ name: nameValidation, owner_id: user.id })
      .select()
      .single();

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    // Add owner as member
    await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
      role: "owner",
    });

    return NextResponse.json({ team: { ...team, role: "owner" } });
  } catch (err) {
    logApiError("/api/team", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}