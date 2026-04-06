import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logApiError } from "@/lib/logger";
import { checkRateLimit, detectBot } from "@/lib/security";

// GET /api/ab/experiments/[id] — single experiment with computed stats
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: experiment, error } = await supabase
      .from("ab_experiments")
      .select(`
        *,
        variants:ab_variants(*),
        results:ab_results(*)
      `)
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !experiment) {
      return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
    }

    // Compute per-variant stats
    const variantStats = (experiment.variants ?? []).map((v: any) => {
      const vResults = (experiment.results ?? []).filter((r: any) => r.variant_id === v.id);
      const conversions = vResults.filter((r: any) => r.conversion).length;
      const revenue = vResults.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);
      const rate = vResults.length > 0 ? ((conversions / vResults.length) * 100).toFixed(1) : "0.0";
      return {
        ...v,
        visitors: vResults.length,
        conversions,
        conversion_rate: parseFloat(rate),
        revenue,
      };
    });

    const { results: _raw, ...rest } = experiment;
    return NextResponse.json({ experiment: { ...rest, variant_stats: variantStats } });
  } catch (err) {
    logApiError("/api/ab/experiments/[id]", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/ab/experiments/[id] — update status or metadata
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const botCheck = detectBot(request);
    if (botCheck.isBot) {
      return NextResponse.json({ error: "Automated requests not allowed" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rateLimit = await checkRateLimit("api", user.id);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    let body: any;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    const allowedStatuses = ["draft", "running", "paused", "completed"];
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.status) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
      if (body.status === "running" && !body.start_date) updates.start_date = new Date().toISOString();
      if (body.status === "completed" && !body.end_date) updates.end_date = new Date().toISOString();
    }
    if (body.traffic_split !== undefined) updates.traffic_split = body.traffic_split;
    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;

    const { data: experiment, error } = await supabase
      .from("ab_experiments")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id) // scoped — prevents IDOR
      .select()
      .single();

    if (error || !experiment) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }

    return NextResponse.json({ experiment });
  } catch (err) {
    logApiError("/api/ab/experiments/[id]", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/ab/experiments/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("ab_experiments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // scoped — prevents IDOR

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    logApiError("/api/ab/experiments/[id]", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
