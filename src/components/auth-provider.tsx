"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { clearSession, getSession, setSession, type Session, type Role } from "@/lib/api-client";

type AuthContextValue = {
  session: Session | null;
  hydrated: boolean;
  signIn: (s: Session) => void;
  signOut: () => void;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSessionState] = React.useState<Session | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setSessionState(getSession());
    setHydrated(true);
  }, []);

  const signIn = React.useCallback((s: Session) => {
    setSession(s);
    setSessionState(s);
  }, []);

  const signOut = React.useCallback(() => {
    clearSession();
    setSessionState(null);
    router.push("/login");
  }, [router]);

  const hasRole = React.useCallback(
    (...roles: Role[]) => !!session && roles.includes(session.role),
    [session],
  );

  return (
    <AuthContext.Provider value={{ session, hydrated, signIn, signOut, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(roles?: Role[]) {
  const router = useRouter();
  const { session, hydrated, hasRole } = useAuth();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (roles && roles.length > 0 && !hasRole(...roles)) {
      router.replace("/unauthorized");
    }
  }, [hydrated, session, router, roles, hasRole]);

  return { session, hydrated };
}
