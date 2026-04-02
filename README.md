# StorePilot.ai

**The AI-Powered Abandoned Cart Recovery & Inventory Management Platform for Shopify Merchants.**

StorePilot is a multi-tenant SaaS platform that autonomously recovers lost revenue and optimizes inventory using three specialized AI agents — all configurable via a self-serve dashboard.

---

## 🤖 The Three Agents

### 1. Voice Closer (Bland.ai)
Triggers a real AI voice call to customers who abandoned their cart. Uses a configurable persona and custom sales script.

### 2. WhatsApp Nudge Agent (Twilio + OpenAI)
Sends a personalized, sentiment-aware WhatsApp message to recover lost sales. Supports two-way conversation powered by GPT-4o-mini.

### 3. Inventory Optimizer (Shopify + OpenAI)
Runs automatically every morning at 8 AM EST. Scans Shopify inventory, calculates velocity thresholds, and drafts Purchase Orders for low-stock SKUs using OpenAI.

---

## 🛡️ Security Features
- **AES-256-GCM Encryption**: All merchant API keys encrypted at rest.
- **Stripe Paywall**: Full subscription billing with a `<SubscriptionGuard>` enforcing access.
- **Upstash Redis Rate Limiting**: Global edge-level DDoS protection on all API routes.
- **Supabase RLS**: Row-Level Security enforced for all database tables.
- **Shopify HMAC Validation**: Webhook signatures verified before processing.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + Auth) |
| Queue | Inngest |
| Billing | Stripe |
| Rate Limiting | Upstash Redis |
| Voice Agent | Bland.ai |
| WhatsApp | Twilio |
| AI | OpenAI GPT-4o-mini |

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/StorePilot.git
cd StorePilot
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` to `.env.local` and fill in all required keys:
```bash
cp .env.example .env.local
```

### 3. Run Database Migrations
Execute both SQL files in your Supabase SQL Editor:
- `schema.sql` — Core tables with RLS policies
- `schema-stripe.sql` — Subscription billing table

### 4. Run Locally
```bash
npm run dev
```

Your app will be running at `http://localhost:3000`.

---

## 🌐 Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub.
2. Import the project on [Vercel](https://vercel.com).
3. Set all environment variables from `.env.example` in the Vercel dashboard.
4. Deploy!

---

## 📄 License
MIT
