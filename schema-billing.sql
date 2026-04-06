-- StorePilot Phase 6 Schema: Unified Billing (Stripe + Razorpay)
-- Run this in the Supabase SQL Editor

-- 1. Create the unified subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay', 'manual')),
    provider_customer_id TEXT, -- e.g., cus_xxxxx or cust_xxxx
    provider_subscription_id TEXT UNIQUE, -- e.g., sub_xxxxx
    status TEXT NOT NULL, -- 'active', 'past_due', 'canceled', etc.
    plan_id TEXT NOT NULL, -- Our internal plan ID (e.g., 'pro_monthly', 'enterprise')
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We drop the old stripe-exclusive one if it was strictly enforced, 
-- but since we're using a single 'subscriptions' table, we can just alter it if it existed.
-- If you already ran schema-stripe.sql, you'll need to drop the old table first ONLY IF it has no production data:
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- 2. Create invoices / payments history table (Optional but highly recommended)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'razorpay')),
    provider_payment_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL, -- in cents/paise
    currency TEXT NOT NULL,
    status TEXT NOT NULL, -- 'succeeded', 'failed', 'pending'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies for Subscriptions
CREATE POLICY "Users can only view their own subscriptions" 
    ON public.subscriptions 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policies for Payments
CREATE POLICY "Users can only view their own payments" 
    ON public.payments 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Webhook execution note: 
-- Insert/Update on these tables should only be done via the Service Role Key in Next.js API Routes.
