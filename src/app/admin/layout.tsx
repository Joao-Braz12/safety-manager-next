"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  Users,
  Layers,
  Film,
  ClipboardList,
  ListChecks,
  FileBarChart2,
  Briefcase,
} from "lucide-react";
import { BrandLink } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useRequireAuth, useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Console", icon: Activity, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/companies", label: "Companies", icon: Building2, roles: ["ROLE_ADMIN"] },
  { href: "/admin/projects", label: "Projects", icon: Briefcase, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/teams", label: "Teams", icon: Layers, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/users", label: "People", icon: Users, roles: ["ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/videos", label: "Videos", icon: Film, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/briefings", label: "Briefings", icon: ClipboardList, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/assignments", label: "Assignments", icon: ListChecks, roles: ["ROLE_PROJECT_LEADER", "ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart2, roles: ["ROLE_COMPANY_ADMIN", "ROLE_ADMIN"] },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { hydrated, session } = useRequireAuth([
    "ROLE_PROJECT_LEADER",
    "ROLE_COMPANY_ADMIN",
    "ROLE_ADMIN",
  ]);
  const { hasRole } = useAuth();
  const pathname = usePathname();

  if (!hydrated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bone)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-graphite-500)]">
          Loading console…
        </div>
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => hasRole(...(n.roles as readonly any[])));

  return (
    <div className="min-h-screen bg-[var(--color-bone)] flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 bg-[var(--color-ink)] text-white border-r border-[var(--color-graphite-800)] sticky top-0 h-screen">
        <div className="px-7 py-7">
          <BrandLink tone="white" />
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
            / Admin Console
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-px overflow-y-auto">
          {visibleNav.map((n) => {
            const Icon = n.icon;
            const active = pathname === n.href || (n.href !== "/admin" && pathname.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 text-sm transition-colors relative",
                  active
                    ? "bg-[var(--color-graphite-900)] text-white"
                    : "text-white/60 hover:text-white hover:bg-[var(--color-graphite-900)]/60",
                )}
              >
                {active && (
                  <span className="absolute left-0 inset-y-0 w-[3px] bg-[var(--color-brand)]" />
                )}
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-7 py-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
              Connected
            </div>
            <LanguageSwitcher tone="white" />
          </div>
          <div className="flex items-center justify-between mt-2">
            <UserMenu tone="white" />
          </div>
        </div>
      </aside>

      {/* Content column (holds the mobile topbar + page on small screens) */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between gap-3 p-4 bg-[var(--color-ink)] text-white sticky top-0 z-30">
          <BrandLink tone="white" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher tone="white" />
            <UserMenu tone="white" />
          </div>
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
