"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { messages, LOCALES, type Locale } from "./messages";

type Vars = Record<string, string | number>;
type TFn = (key: string, vars?: Vars) => string;

type LangContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: TFn;
};

const LangContext = createContext<LangContextValue | null>(null);

const COOKIE = "lang";

function lookup(dict: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), dict);
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

function isLocale(v: string | null | undefined): v is Locale {
  return !!v && (LOCALES as string[]).includes(v);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Server + first client render default to "en" to avoid hydration mismatch;
  // the stored/preferred locale is applied in an effect.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE);
    if (isLocale(stored)) {
      setLocaleState(stored);
      return;
    }
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (isLocale(nav)) setLocaleState(nav);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(COOKIE, l);
    } catch {
      /* ignore */
    }
    document.cookie = `${COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback<TFn>(
    (key, vars) => {
      const val = lookup(messages[locale], key) ?? lookup(messages.en, key);
      if (typeof val !== "string") return key;
      return interpolate(val, vars);
    },
    [locale],
  );

  return (
    <LangContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LangContext.Provider>
  );
}

function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT/useLocale must be used within <LanguageProvider>");
  return ctx;
}

export function useT(): TFn {
  return useLang().t;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useLang();
  return { locale, setLocale };
}

/** BCP-47 tag for Intl APIs (date/number formatting). */
export function intlLocale(locale: Locale): string {
  return locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en-GB";
}
