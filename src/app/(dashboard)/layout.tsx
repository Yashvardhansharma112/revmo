"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Package,
  MessageCircle,
  Phone,
  Users,
  Megaphone,
  Zap,
  Inbox,
  Link2,
  Settings,
  BarChart3,
  ChevronLeft,
  Bell,
  LogOut,
  Search,
  FlaskConical,
} from "lucide-react";

const navSections = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    title: "AI Agents",
    items: [
      { href: "/agents/inventory", icon: Package, label: "Inventory Optimizer", badge: "Live" },
      { href: "/agents/whatsapp", icon: MessageCircle, label: "WhatsApp Nudge", badge: "3" },
      { href: "/agents/voice", icon: Phone, label: "Voice Closer" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/customers", icon: Users, label: "Customers" },
      { href: "/campaigns", icon: Megaphone, label: "Campaigns" },
      { href: "/ab-tests", icon: FlaskConical, label: "A/B Tests", badge: "New" },
      { href: "/automation", icon: Zap, label: "Automation" },
      { href: "/inbox", icon: Inbox, label: "Inbox", badge: "12" },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/integrations", icon: Link2, label: "Integrations" },
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-[rgba(8,8,28,0.95)] backdrop-blur-[30px] border-r border-[var(--color-border-glass)] transition-all duration-300 ${
          collapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--color-border-glass)]">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-extrabold tracking-tight">
              StorePilot
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="px-4 pt-4 pb-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[rgba(124,58,237,0.15)] text-[#c4b5fd] shadow-[inset_3px_0_0_var(--color-accent)]"
                        : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white"
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[var(--color-border-glass)] p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-[var(--color-text-muted)] hover:bg-[rgba(255,255,255,0.05)] hover:text-white transition cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-[68px]" : "ml-[260px]"
        }`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-16 bg-[rgba(5,5,16,0.9)] backdrop-blur-xl border-b border-[var(--color-border-glass)] flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-glass)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition cursor-pointer"
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform ${
                  collapsed ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[var(--color-border-glass)] w-64">
              <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm outline-none w-full placeholder:text-[var(--color-text-muted)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border-glass)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-accent-rose)]" />
            </button>
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-xs font-bold">
              RS
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">{children}</div>
      </main>
    </div>
  );
}
