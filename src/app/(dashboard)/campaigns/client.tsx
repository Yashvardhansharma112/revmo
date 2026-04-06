"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Megaphone, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Play, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Target,
  BarChart3,
  Split
} from "lucide-react";
import { format } from "date-fns";

type Campaign = {
  id: string;
  name: string;
  description: string;
  agent_type: 'whatsapp' | 'voice' | 'sms';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  is_ab_test: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at: string;
  recipients_count?: number;
  conversion_rate?: number;
  current_step?: number;
  total_steps?: number;
  delivered_count?: number;
  interacted_count?: number;
};

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "1",
    name: "Spring Sale WhatsApp Blast",
    description: "Nudging previous abandoned cart users with a 15% discount code.",
    agent_type: "whatsapp",
    status: "running",
    is_ab_test: true,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "08:00:00",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    recipients_count: 1240,
    conversion_rate: 8.4,
    current_step: 2,
    total_steps: 4,
    delivered_count: 980,
    interacted_count: 145,
  },
  {
    id: "2",
    name: "VIP Customer Voice Closer",
    description: "AI-driven follow-up calls to customers who spent > ₹5,000.",
    agent_type: "voice",
    status: "completed",
    is_ab_test: false,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "08:00:00",
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    recipients_count: 450,
    conversion_rate: 12.1,
    current_step: 1,
    total_steps: 1,
    delivered_count: 450,
    interacted_count: 82,
  },
  {
    id: "3",
    name: "New Product Launch Survey",
    description: "Collecting feedback on the new summer collection.",
    agent_type: "whatsapp",
    status: "draft",
    is_ab_test: false,
    quiet_hours_start: "22:00:00",
    quiet_hours_end: "08:00:00",
    created_at: new Date().toISOString(),
    recipients_count: 0,
    conversion_rate: 0,
  }
];

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Initial data fetch simulation
    const fetchCampaigns = async () => {
      try {
        const response = await fetch("/api/campaigns");
        if (response.ok) {
          const data = await response.json();
          // Merge real data with mock if needed, or just use real if available
          setCampaigns(data.length > 0 ? data : MOCK_CAMPAIGNS);
        } else {
          setCampaigns(MOCK_CAMPAIGNS);
        }
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        setCampaigns(MOCK_CAMPAIGNS);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case "running":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(34,197,94,0.1)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            RUNNING
          </span>
        );
      case "completed":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(124,58,237,0.1)] text-[#a78bfa] border border-[rgba(124,58,237,0.2)]">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case "draft":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(156,163,175,0.1)] text-[#9ca3af] border border-[rgba(156,163,175,0.2)]">
            <Clock className="w-3 h-3" />
            DRAFT
          </span>
        );
      case "scheduled":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(59,130,246,0.1)] text-[#60a5fa] border border-[rgba(59,130,246,0.2)]">
            <Calendar className="w-3 h-3" />
            SCHEDULED
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[rgba(239,68,68,0.1)] text-[#f87171] border border-[rgba(239,68,68,0.2)]">
            <AlertCircle className="w-3 h-3" />
            {status.toUpperCase()}
          </span>
        );
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Overview Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[rgba(124,58,237,0.1)] flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <span className="text-[10px] font-bold text-[#4ade80]">+2 this week</span>
          </div>
          <div>
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-[var(--color-text-muted)]">Active Campaigns</div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.1)] flex items-center justify-center">
              <Target className="w-5 h-5 text-[#4ade80]" />
            </div>
            <span className="text-[10px] font-bold text-[#4ade80]">8.2% avg</span>
          </div>
          <div>
            <div className="text-2xl font-bold">18,400</div>
            <div className="text-xs text-[var(--color-text-muted)]">Total Reach</div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[rgba(251,191,36,0.1)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <span className="text-[10px] font-bold text-[#fbbf24]">Top: 12.1%</span>
          </div>
          <div>
            <div className="text-2xl font-bold">₹1.4M</div>
            <div className="text-xs text-[var(--color-text-muted)]">Revenue Recovered</div>
          </div>
        </div>

        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#60a5fa]" />
            </div>
            <span className="text-[10px] font-bold text-[#60a5fa]">4 experiments</span>
          </div>
          <div>
            <div className="text-2xl font-bold">1,240</div>
            <div className="text-xs text-[var(--color-text-muted)]">AI Conversational Turns</div>
          </div>
        </div>
      </div>

      {/* ── Table Controls ── */}
      <div className="flex flex-col md:flex-row items-center gap-4 py-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent)] transition-colors" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-glass)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="h-11 px-4 rounded-xl border border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.05)] transition flex items-center gap-2 text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <Link 
            href="/campaigns/new" 
            className="h-11 px-6 rounded-xl bg-gradient-to-r from-[var(--color-accent)] to-[#a78bfa] text-white text-sm font-bold shadow-lg shadow-[rgba(124,58,237,0.3)] hover:translate-y-[-1px] active:translate-y-[0px] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* ── Campaign Table ── */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border-glass)] bg-[rgba(255,255,255,0.02)]">
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Campaign Overview</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Channel</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-center">Progress</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-center">Engagement</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-center">ROI</th>
                <th className="px-6 py-4 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-[var(--color-text-muted)] italic">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Loading campaigns...
                  </td>
                </tr>
              ) : filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Megaphone className="w-10 h-10 text-[rgba(255,255,255,0.1)] mx-auto mb-4" />
                    <div className="text-lg font-bold mb-1">No Campaigns Found</div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-6">Start your first automated outreach campaign.</p>
                    <Link href="/campaigns/new" className="text-[var(--color-accent)] font-bold text-sm hover:underline">
                      Create Campaign &rarr;
                    </Link>
                  </td>
                </tr>
              ) : filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-[var(--color-border-glass)] hover:bg-[rgba(255,255,255,0.01)] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-sm text-white group-hover:text-[var(--color-accent)] transition-colors">{campaign.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-1 max-w-[200px]">
                      {campaign.description}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                        campaign.agent_type === 'whatsapp' ? 'bg-[rgba(34,197,94,0.1)] text-[#4ade80]' : 'bg-[rgba(59,130,246,0.1)] text-[#60a5fa]'
                       }`}>
                          {campaign.agent_type === 'whatsapp' ? 'WA' : 'VO'}
                       </div>
                       <span className="text-xs font-medium capitalize">{campaign.agent_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {getStatusBadge(campaign.status)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {campaign.total_steps ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-bold text-white">Step {campaign.current_step || 1}/{campaign.total_steps}</div>
                        <div className="w-20 h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                          <div 
                            className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500"
                            style={{ width: `${((campaign.current_step || 1) / campaign.total_steps) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-[var(--color-text-muted)] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-bold text-white">
                        {campaign.interacted_count || 0}
                      </div>
                      <div className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-tighter">
                        Interactions
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="text-sm font-bold text-[#4ade80]">
                      {campaign.conversion_rate}%
                    </div>
                    <div className="flex items-center justify-center gap-0.5 text-[9px] text-[var(--color-text-muted)]">
                      <TrendingUp className="w-2.5 h-2.5" />
                      Recovered
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="w-8 h-8 rounded-lg hover:bg-[rgba(255,255,255,0.05)] flex items-center justify-center ml-auto transition border border-transparent hover:border-[var(--color-border-glass)]">
                      <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-[var(--color-border-glass)] bg-[rgba(255,255,255,0.01)]">
          <div className="text-xs text-[var(--color-text-muted)]">
            Showing <span className="text-white font-bold">{filteredCampaigns.length}</span> of <span className="text-white font-bold">{campaigns.length}</span> campaigns
          </div>
          <div className="flex gap-2">
            <button disabled className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-glass)] text-xs text-[var(--color-text-muted)] cursor-not-allowed">Previous</button>
            <button disabled className="px-3 py-1 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--color-border-glass)] text-xs text-[var(--color-text-muted)] cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {/* ── Quick Tips ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 rounded-2xl bg-[rgba(124,58,237,0.05)] border border-[rgba(124,58,237,0.1)] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(124,58,237,0.1)] flex items-center justify-center flex-shrink-0">
            <Split className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">A/B Testing Best Practices</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Try testing different starting lines. Even a slight change from "Hi {'{{name}}'}!" to "Hey {'{{name}}'}!" can impact conversion rates by up to 15%.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.1)] flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.1)] flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-5 h-5 text-[#4ade80]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Boost Your Recovery</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Combine WhatsApp and Voice for a multi-touch approach. Send a WhatsApp nudge first, then follow up with a call if they don't respond in 4 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
