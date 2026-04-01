-- Revmo.ai Phase 2 Schema: Agent Configurations
-- Run this in the Supabase SQL Editor

-- Create the agent_configurations table
CREATE TABLE IF NOT EXISTS public.agent_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('inventory', 'whatsapp', 'voice', 'integrations')),
    api_keys JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, agent_type)
);

-- Enable RLS
ALTER TABLE public.agent_configurations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can only view their own agent configurations" 
    ON public.agent_configurations 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent configurations" 
    ON public.agent_configurations 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent configurations" 
    ON public.agent_configurations 
    FOR UPDATE 
    USING (auth.uid() = user_id);
