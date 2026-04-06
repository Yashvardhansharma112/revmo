import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        campaign_variants (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("Campaigns API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      description, 
      agent_type, 
      is_ab_test, 
      quiet_hours_start, 
      quiet_hours_end, 
      timezone,
      variants 
    } = body;

    if (!name || !agent_type) {
      return NextResponse.json({ error: "Name and Agent Type are required" }, { status: 400 });
    }

    // 1. Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name,
        description,
        agent_type,
        is_ab_test,
        quiet_hours_start,
        quiet_hours_end,
        timezone,
        status: "draft"
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 2. Create variants if provided
    if (variants && variants.length > 0) {
      const variantsToInsert = variants.map((v: any) => ({
        campaign_id: campaign.id,
        name: v.name,
        content: v.content || "", // Fallback
        steps: v.steps || [], // New sequence steps
        prompt_config: v.prompt_config || {},
        is_control: v.is_control || false,
        traffic_weight: v.traffic_weight || (100 / variants.length)
      }));

      const { error: variantError } = await supabase
        .from("campaign_variants")
        .insert(variantsToInsert);

      if (variantError) throw variantError;
    }

    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error("Campaign Create API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
