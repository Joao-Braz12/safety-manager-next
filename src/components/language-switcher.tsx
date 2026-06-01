"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, Globe } from "lucide-react";
import { useLocale } from "@/i18n";
import { LOCALES, type Locale } from "@/i18n/messages";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, string> = {
  en: "EN",
  pt: "PT",
  es: "ES",
};

const NAMES: Record<Locale, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};

export function LanguageSwitcher({ tone = "ink" }: { tone?: "ink" | "white" }) {
  const { locale, setLocale } = useLocale();
  const isWhite = tone === "white";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Language"
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] focus:outline-none transition-colors",
            isWhite
              ? "text-white/70 hover:text-white"
              : "text-[var(--color-graphite-500)] hover:text-[var(--color-ink)]",
          )}
        >
          <Globe className="h-3.5 w-3.5" />
          {LABELS[locale]}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={12}
          className="z-50 w-44 bg-[var(--color-bone)] border border-[var(--color-ink)] shadow-[6px_6px_0_0_var(--color-ink)] data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          {LOCALES.map((l) => (
            <DropdownMenu.Item
              key={l}
              onSelect={() => setLocale(l)}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer focus:outline-none focus:bg-[var(--color-ink)] focus:text-white"
            >
              {NAMES[l]}
              {l === locale && <Check className="h-4 w-4" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
