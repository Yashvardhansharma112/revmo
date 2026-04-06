-- StorePilot Complete Migration
-- Run this file in Supabase SQL Editor to create all tables
-- Generated: 2026-04-06

-- =============================================
-- Enable Required Extensions
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Phase 3: Agent Activity Tracking
-- =============================================

-- Agent Activity Log - tracks all agent actions
CREATE TABLE IF NOT EXISTS public.agent_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    action_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    details JSONB DEFAULT '{}'::jsonb,
    amount_recovered NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Run History - tracks when agents ran
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    items_processed INTEGER DEFAULT 0,
    success_rate NUMERIC DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent Test Logs - for test mode
CREATE TABLE IF NOT EXISTS public.agent_tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    test_type TEXT NOT NULL,
    recipient TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics aggregations
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    whatsapp_messages_sent INTEGER DEFAULT 0,
    whatsapp_messages_delivered INTEGER DEFAULT 0,
    whatsapp_carts_recovered INTEGER DEFAULT 0,
    whatsapp_revenue_recovered NUMERIC DEFAULT 0,
    voice_calls_made INTEGER DEFAULT 0,
    voice_calls_completed INTEGER DEFAULT 0,
    voice_deals_closed INTEGER DEFAULT 0,
    voice_revenue_recovered NUMERIC DEFAULT 0,
    inventory_scans INTEGER DEFAULT 0,
    low_stock_alerts INTEGER DEFAULT 0,
    reorders_created INTEGER DEFAULT 0,
    stock_value_saved NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- =============================================
-- Team Collaboration
-- =============================================

-- Teams
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Team invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Multi-Store Support
-- =============================================

-- Stores
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('shopify', 'woocommerce', 'magento')) DEFAULT 'shopify',
    store_url TEXT NOT NULL,
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_url)
);

-- Store webhooks
CREATE TABLE IF NOT EXISTS public.store_webhooks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    topic TEXT NOT NULL,
    webhook_id TEXT,
    callback_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, topic)
);

-- Store metrics
CREATE TABLE IF NOT EXISTS public.store_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    revenue NUMERIC DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    products_count INTEGER DEFAULT 0,
    customers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, date)
);

-- =============================================
-- A/B Testing
-- =============================================

-- A/B Experiments
CREATE TABLE IF NOT EXISTS public.ab_experiments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('whatsapp', 'voice', 'inventory')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'running', 'paused', 'completed')) DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    traffic_split INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Variants
CREATE TABLE IF NOT EXISTS public.ab_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    experiment_id UUID REFERENCES public.ab_experiments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    prompt TEXT NOT NULL,
    is_control BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Results
CREATE TABLE IF NOT EXISTS public.ab_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    experiment_id UUID REFERENCES public.ab_experiments(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.ab_variants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    visitor_id TEXT,
    conversion BOOLEAN DEFAULT FALSE,
    revenue NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- Enable Row Level Security
-- =============================================

ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_results ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Agent Activity
CREATE POLICY "Users can view their own agent activity" ON public.agent_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agent activity" ON public.agent_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Agent Runs
CREATE POLICY "Users can view their own agent runs" ON public.agent_runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agent runs" ON public.agent_runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agent runs" ON public.agent_runs FOR UPDATE USING (auth.uid() = user_id);

-- Agent Tests
CREATE POLICY "Users can view their own agent tests" ON public.agent_tests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own agent tests" ON public.agent_tests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Daily Metrics
CREATE POLICY "Users can view their own daily metrics" ON public.daily_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own daily metrics" ON public.daily_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own daily metrics" ON public.daily_metrics FOR UPDATE USING (auth.uid() = user_id);

-- Teams
CREATE POLICY "Team owners can manage their teams" ON public.teams FOR ALL USING (auth.uid() = owner_id);

-- Team Members
CREATE POLICY "Team members can view their teams" ON public.team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Team members can be inserted" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team Invitations
CREATE POLICY "Team owners can manage invitations" ON public.team_invitations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.team_invitations.team_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Stores
CREATE POLICY "Users can view their own stores" ON public.stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stores" ON public.stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stores" ON public.stores FOR DELETE USING (auth.uid() = user_id);

-- Store Webhooks
CREATE POLICY "Users can manage webhooks for their stores" ON public.store_webhooks FOR ALL USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
);

-- Store Metrics
CREATE POLICY "Users can view metrics for their stores" ON public.store_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert metrics for their stores" ON public.store_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- A/B Experiments
CREATE POLICY "Users can view their own experiments" ON public.ab_experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own experiments" ON public.ab_experiments FOR ALL USING (auth.uid() = user_id);

-- A/B Variants
CREATE POLICY "Users can view their own variants" ON public.ab_variants FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ab_experiments WHERE id = experiment_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their own variants" ON public.ab_variants FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ab_experiments WHERE id = experiment_id AND user_id = auth.uid())
);

-- A/B Results
CREATE POLICY "Users can view their own results" ON public.ab_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own results" ON public.ab_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_agent_activity_user_date ON public.agent_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_date ON public.agent_runs(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_stores_user ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_team ON public.stores(team_id);
CREATE INDEX IF NOT EXISTS idx_store_metrics_store_date ON public.store_metrics(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_user ON public.ab_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_experiment ON public.ab_results(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant ON public.ab_results(variant_id);

-- =============================================
-- Migration Complete
-- =============================================