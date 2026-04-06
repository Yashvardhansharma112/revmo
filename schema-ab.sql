-- StorePilot A/B Testing Schema
-- Run this in the Supabase SQL Editor

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
    traffic_split INTEGER DEFAULT 50, -- Percentage to variant A
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Variants
CREATE TABLE IF NOT EXISTS public.ab_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    experiment_id UUID REFERENCES public.ab_experiments(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- 'A' or 'B', or custom names
    prompt TEXT NOT NULL, -- The prompt/variable being tested
    is_control BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Results
CREATE TABLE IF NOT EXISTS public.ab_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    experiment_id UUID REFERENCES public.ab_experiments(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.ab_variants(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    visitor_id TEXT, -- Anonymous visitor identifier
    conversion BOOLEAN DEFAULT FALSE,
    revenue NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own experiments" 
    ON public.ab_experiments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own experiments" 
    ON public.ab_experiments FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own variants" 
    ON public.ab_variants FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.ab_experiments 
            WHERE id = experiment_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own variants" 
    ON public.ab_variants FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.ab_experiments 
            WHERE id = experiment_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own results" 
    ON public.ab_results FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own results" 
    ON public.ab_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_experiments_user ON public.ab_experiments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_experiment ON public.ab_results(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_results_variant ON public.ab_results(variant_id);