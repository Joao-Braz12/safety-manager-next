"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLink } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function AppTopbar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const t = useT();
  const isAdmin = session && session.role !== "ROLE_USER";

  const links = isAdmin
    ? [
        { href: "/dashboard", label: t("nav.myBriefings") },
        { href: "/admin", label: t("nav.console") },
      ]
    : [
        { href: "/dashboard", label: t("nav.dashboard") },
        { href: "/briefings", label: t("nav.briefings") },
      ];

  return (
    <header className="sticky top-0 z-30 bg-[var(--color-bone)]/85 backdrop-blur-md border-b border-[var(--color-graphite-200)]">
      <div className="max-w-[1480px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        <div className="flex items-center gap-10">
          <BrandLink href="/" />
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-graphite-500)] hover:text-[var(--color-ink)]",
                  )}
                >
                  {l.label}
                  {active && (
                    <span className="absolute -bottom-[17px] left-3 right-3 h-[2px] bg-[var(--color-acciona-red)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <span className="hidden lg:inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--color-success)] rounded-full" />
            {t("nav.systemsOperational")}
          </span>
          <LanguageSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
