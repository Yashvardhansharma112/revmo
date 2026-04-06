# StorePilot Features Tracker

## Completed Features

### Phase 1: Core Platform
- [x] Authentication (login, signup, password reset, email verification)
- [x] Dashboard with charts
- [x] WhatsApp Agent configuration
- [x] Voice Agent configuration
- [x] Inventory Agent configuration
- [x] Integrations page (API keys management with encryption)

### Phase 2: Security
- [x] Rate limiting with Upstash Redis
- [x] Bot detection
- [x] Input validation
- [x] API key encryption (AES-256-GCM with versioned prefix)
- [x] Security headers
- [x] Timing-safe HMAC webhook verification (`crypto.timingSafeEqual`)
- [x] IDOR prevention in Inngest background jobs (userId-scoped DB queries)
- [x] Rate-limit keys use authenticated `user.id` (not spoofable headers)

### Phase 3: Agent Activity & Testing
- [x] Agent Activity API endpoint
- [x] Test Mode API endpoint  
- [x] Analytics API endpoint
- [x] DashboardCharts with real data fetching
- [x] Test Mode UI (WhatsApp agent)
- [x] Test Mode UI (Voice agent)

### Phase 4: Team Collaboration
- [x] Teams database schema
- [x] Team members management API
- [x] Team invitations
- [x] Team UI tab in Integrations page

### Phase 5: Multi-Store Support
- [x] Stores database schema
- [x] Multi-store API endpoints
- [x] Stores UI tab in Integrations page
- [x] Per-store API key encryption

### Phase 6: A/B Testing ✅ NEW
- [x] A/B Testing database schema (`schema-ab.sql`)
- [x] `GET/POST /api/ab/experiments` — list & create experiments
- [x] `GET/PATCH/DELETE /api/ab/experiments/[id]` — manage & fetch per-variant stats
- [x] `GET/POST /api/ab/assign` — deterministic visitor assignment & result recording
- [x] A/B Tests dashboard page (`/ab-tests`)
- [x] Experiment create modal (name, agent type, variants, traffic split slider)
- [x] Status lifecycle controls (draft → running → paused → completed)
- [x] Per-variant conversion stats with winner detection
- [x] Sidebar nav link under Marketing section

---

## API Endpoints Reference

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/auth/*` | ALL | ✅ Ready |
| `/api/agents/whatsapp` | GET/POST | ✅ Ready |
| `/api/agents/voice` | GET/POST | ✅ Ready |
| `/api/agents/inventory` | GET/POST | ✅ Ready |
| `/api/agents/integrations` | GET/POST | ✅ Ready |
| `/api/agents/activity` | GET | ✅ Ready |
| `/api/agents/tests` | GET/POST | ✅ Ready |
| `/api/analytics` | GET | ✅ Ready |
| `/api/team` | GET/POST | ✅ Ready |
| `/api/team/members` | GET/POST/DELETE | ✅ Ready |
| `/api/stores` | GET/POST | ✅ Ready |
| `/api/stores/update` | PATCH/DELETE | ✅ Ready |
| `/api/ab/experiments` | GET/POST | ✅ Ready |
| `/api/ab/experiments/[id]` | GET/PATCH/DELETE | ✅ Ready |
| `/api/ab/assign` | GET/POST | ✅ Ready |

---

## Database Migrations Required
Run in Supabase SQL Editor before using A/B features:
- `schema-ab.sql` — `ab_experiments`, `ab_variants`, `ab_results` tables with RLS

## Last Updated: 2026-04-06