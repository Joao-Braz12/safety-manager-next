"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

export function UserMenu({ tone = "ink" }: { tone?: "ink" | "white" }) {
  const { session, signOut } = useAuth();
  const t = useT();
  if (!session) return null;

  const initials = session.fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isWhite = tone === "white";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-3 group focus:outline-none",
            isWhite ? "text-white" : "text-[var(--color-ink)]",
          )}
        >
          <span
            className={cn(
              "h-9 w-9 flex items-center justify-center font-mono text-[11px] font-semibold",
              isWhite
                ? "bg-white text-[var(--color-ink)]"
                : "bg-[var(--color-ink)] text-white",
            )}
          >
            {initials || "??"}
          </span>
          <span className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-sm font-medium">{session.fullName}</span>
            <span
              className={cn(
                "text-[10px] font-mono uppercase tracking-[0.14em]",
                isWhite ? "text-white/60" : "text-[var(--color-graphite-500)]",
              )}
            >
              {t(`roles.${session.role}`)}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform group-data-[state=open]:rotate-180",
              isWhite ? "text-white/60" : "text-[var(--color-graphite-500)]",
            )}
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={12}
          className="z-50 w-56 bg-[var(--color-bone)] border border-[var(--color-ink)] shadow-[6px_6px_0_0_var(--color-ink)] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div className="px-3 py-3 border-b border-[var(--color-graphite-200)]">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--color-graphite-500)]">
              {t("userMenu.signedInAs")}
            </div>
            <div className="mt-1 text-sm font-medium truncate">{session.fullName}</div>
          </div>
          <DropdownMenu.Item asChild>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer focus:outline-none focus:bg-[var(--color-ink)] focus:text-white"
            >
              <User className="h-4 w-4" /> {t("userMenu.profile")}
            </Link>
          </DropdownMenu.Item>
          {session.role !== "ROLE_USER" && (
            <DropdownMenu.Item asChild>
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer focus:outline-none focus:bg-[var(--color-ink)] focus:text-white"
              >
                <Settings className="h-4 w-4" /> {t("userMenu.adminConsole")}
              </Link>
            </DropdownMenu.Item>
          )}
          <div className="border-t border-[var(--color-graphite-200)]" />
          <DropdownMenu.Item
            onSelect={signOut}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer focus:outline-none focus:bg-[var(--color-brand)] focus:text-white text-[var(--color-brand-deep)]"
          >
            <LogOut className="h-4 w-4" /> {t("userMenu.signOut")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
