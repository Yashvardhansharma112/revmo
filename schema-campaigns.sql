-- StorePilot Phase 3: AI Campaign Builder Schema
-- Run this in the Supabase SQL Editor

-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL CHECK (agent_type IN ('whatsapp', 'voice', 'sms')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
    
    -- Safety Window (Quiet Hours)
    quiet_hours_start TIME DEFAULT '22:00:00',
    quiet_hours_end TIME DEFAULT '08:00:00',
    timezone TEXT DEFAULT 'UTC',
    
    -- A/B Testing
    is_ab_test BOOLEAN DEFAULT FALSE,
    
    -- Audience & Config
    target_segment JSONB DEFAULT '{}'::jsonb, -- Filter criteria
    config JSONB DEFAULT '{}'::jsonb, -- Global campaign settings
    
    scheduled_for TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Campaign Variants (for A/B Testing)
CREATE TABLE IF NOT EXISTS public.campaign_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g. 'Control', 'Variant B'
    content TEXT NOT NULL, -- The message template or script
    prompt_config JSONB DEFAULT '{}'::jsonb, -- AI specific settings (tone, voiceId)
    is_control BOOLEAN DEFAULT FALSE,
    traffic_weight INTEGER DEFAULT 50, -- Percentage of traffic
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Campaign Recipients (Tracking state per customer)
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES public.campaign_variants(id) ON DELETE SET NULL,
    contact_id TEXT NOT NULL, -- Phone number or external ID
    status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'converted')) DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, contact_id)
);

-- 4. Update agent_activity to track campaign attribution
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_activity' AND column_name='campaign_id') THEN
        ALTER TABLE public.agent_activity ADD COLUMN campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agent_activity' AND column_name='variant_id') THEN
        ALTER TABLE public.agent_activity ADD COLUMN variant_id UUID REFERENCES public.campaign_variants(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Users can manage their own campaigns" 
    ON public.campaigns FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their campaign variants" 
    ON public.campaign_variants FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their campaign recipients" 
    ON public.campaign_recipients FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns 
            WHERE id = campaign_id AND user_id = auth.uid()
        )
    );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON public.campaign_recipients(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_activity_campaign ON public.agent_activity(campaign_id);
