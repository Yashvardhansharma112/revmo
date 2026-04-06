import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, detectBot } from "@/lib/security";
import { logApiError } from "@/lib/logger";
import { validateString } from "@/lib/validation";

// GET - List experiments
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let query = supabase
      .from("ab_experiments")
      .select(`
        *,
        variants:ab_variants(*),
        results_count:ab_results(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: experiments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ experiments: experiments || [] });
  } catch (err) {
    logApiError("/api/ab/experiments", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create experiment
export async function POST(request: Request) {
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, description, agent_type, variants, traffic_split } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate-limit by authenticated user.id (not spoofable x-forwarded-for)
    const rateLimitResult = await checkRateLimit("ab_create", user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const nameValidation = validateString(name, { minLength: 1, maxLength: 100 });
    if (!nameValidation) {
      return NextResponse.json({ error: "Experiment name required" }, { status: 400 });
    }

    const validAgentTypes = ["whatsapp", "voice", "inventory"];
    if (!agent_type || !validAgentTypes.includes(agent_type)) {
      return NextResponse.json({ error: "Valid agent_type required" }, { status: 400 });
    }

    if (!variants || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json({ error: "At least 2 variants required" }, { status: 400 });
    }


    // Create experiment
    const { data: experiment, error: expError } = await supabase
      .from("ab_experiments")
      .insert({
        user_id: user.id,
        name: nameValidation,
        description: description || null,
        agent_type,
        traffic_split: traffic_split || 50,
      })
      .select()
      .single();

    if (expError) {
      return NextResponse.json({ error: expError.message }, { status: 500 });
    }

    // Create variants
    const variantData = variants.map((v: any, i: number) => ({
      experiment_id: experiment.id,
      name: v.name || (i === 0 ? "A" : "B"),
      prompt: v.prompt,
      is_control: i === 0,
    }));

    const { data: createdVariants, error: varError } = await supabase
      .from("ab_variants")
      .insert(variantData)
      .select();

    if (varError) {
      await supabase.from("ab_experiments").delete().eq("id", experiment.id);
      return NextResponse.json({ error: varError.message }, { status: 500 });
    }

    return NextResponse.json({
      experiment: { ...experiment, variants: createdVariants }
    });
  } catch (err) {
    logApiError("/api/ab/experiments", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}