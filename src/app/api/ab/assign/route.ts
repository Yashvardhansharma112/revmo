import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logApiError } from "@/lib/logger";

// GET - Get variant for visitor (deterministic assignment)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const experimentId = searchParams.get("experiment_id");
  const visitorId = searchParams.get("visitor_id");

  if (!experimentId || !visitorId) {
    return NextResponse.json({ error: "experiment_id and visitor_id required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Get experiment
    const { data: experiment } = await supabase
      .from("ab_experiments")
      .select("*, variants:ab_variants(*)")
      .eq("id", experimentId)
      .eq("status", "running")
      .single();

    if (!experiment || !experiment.variants || experiment.variants.length < 2) {
      return NextResponse.json({ error: "Experiment not found or not running" }, { status: 404 });
    }

    // Deterministic assignment based on visitor ID hash
    const hash = visitorId.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
    const normalizedHash = Math.abs(hash) % 100;
    const assignedToControl = normalizedHash < experiment.traffic_split;

    const variant = assignedToControl 
      ? experiment.variants.find((v: any) => v.is_control) 
      : experiment.variants.find((v: any) => !v.is_control);

    return NextResponse.json({
      experiment_id: experimentId,
      variant_id: variant?.id,
      variant_name: variant?.name,
    });
  } catch (err) {
    logApiError("/api/ab/assign", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Record conversion/result
export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { experiment_id, variant_id, visitor_id, conversion, revenue, metadata } = body;

    if (!experiment_id || !variant_id || !visitor_id) {
      return NextResponse.json({ error: "experiment_id, variant_id, visitor_id required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: result, error } = await supabase
      .from("ab_results")
      .insert({
        experiment_id,
        variant_id,
        user_id: user?.id || null,
        visitor_id,
        conversion: conversion || false,
        revenue: revenue || 0,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    logApiError("/api/ab/results", err as Error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}