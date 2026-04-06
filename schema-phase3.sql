-- StorePilot Phase 3 Schema: Agent Activity Tracking
-- Run this in the Supabase SQL Editor

-- Agent Activity Log - tracks all agent actions
CREATE TABLE IF NOT EXISTS public.agent_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    action_type TEXT NOT NULL, -- 'cart_recovered', 'message_sent', 'call_completed', 'reorder_created', 'alert_sent'
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    details JSONB DEFAULT '{}'::jsonb,
    amount_recovered NUMERIC DEFAULT 0, -- Revenue recovered in INR
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Run History - tracks when agents ran and their results
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    items_processed INTEGER DEFAULT 0,
    success_rate NUMERIC DEFAULT 0, -- Percentage 0-100
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Agent Test Logs - for test mode functionality
CREATE TABLE IF NOT EXISTS public.agent_tests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    test_type TEXT NOT NULL, -- 'whatsapp_message', 'voice_call', 'inventory_scan'
    recipient TEXT, -- Phone number or email for testing
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics aggregations - for dashboard metrics (updated daily via cron)
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    
    -- WhatsApp metrics
    whatsapp_messages_sent INTEGER DEFAULT 0,
    whatsapp_messages_delivered INTEGER DEFAULT 0,
    whatsapp_carts_recovered INTEGER DEFAULT 0,
    whatsapp_revenue_recovered NUMERIC DEFAULT 0,
    
    -- Voice metrics
    voice_calls_made INTEGER DEFAULT 0,
    voice_calls_completed INTEGER DEFAULT 0,
    voice_deals_closed INTEGER DEFAULT 0,
    voice_revenue_recovered NUMERIC DEFAULT 0,
    
    -- Inventory metrics
    inventory_scans INTEGER DEFAULT 0,
    low_stock_alerts INTEGER DEFAULT 0,
    reorders_created INTEGER DEFAULT 0,
    stock_value_saved NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.agent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Policies for agent_activity
CREATE POLICY "Users can view their own agent activity" 
    ON public.agent_activity 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent activity" 
    ON public.agent_activity 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for agent_runs
CREATE POLICY "Users can view their own agent runs" 
    ON public.agent_runs 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent runs" 
    ON public.agent_runs 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent runs" 
    ON public.agent_runs 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policies for agent_tests
CREATE POLICY "Users can view their own agent tests" 
    ON public.agent_tests 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent tests" 
    ON public.agent_tests 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Policies for daily_metrics
CREATE POLICY "Users can view their own daily metrics" 
    ON public.daily_metrics 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily metrics" 
    ON public.daily_metrics 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily metrics" 
    ON public.daily_metrics 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_agent_activity_user_date ON public.agent_activity(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_date ON public.agent_runs(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, date DESC);