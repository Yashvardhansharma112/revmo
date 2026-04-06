-- StorePilot Multi-Store Schema
-- Run this in the Supabase SQL Editor

-- Stores table - supports multiple Shopify stores per user
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

-- Store webhooks - track registered webhooks per store
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

-- Store metrics - per-store analytics
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

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_metrics ENABLE ROW LEVEL SECURITY;

-- Stores RLS
CREATE POLICY "Users can view their own stores" 
    ON public.stores FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores" 
    ON public.stores FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" 
    ON public.stores FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" 
    ON public.stores FOR DELETE 
    USING (auth.uid() = user_id);

-- Store webhooks RLS
CREATE POLICY "Users can manage webhooks for their stores" 
    ON public.store_webhooks FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE id = store_id AND user_id = auth.uid()
        )
    );

-- Store metrics RLS
CREATE POLICY "Users can view metrics for their stores" 
    ON public.store_metrics FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert metrics for their stores" 
    ON public.store_metrics FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stores_user ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_team ON public.stores(team_id);
CREATE INDEX IF NOT EXISTS idx_store_metrics_store_date ON public.store_metrics(store_id, date DESC);