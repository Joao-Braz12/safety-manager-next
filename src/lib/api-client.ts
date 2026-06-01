"use client";

export type Role =
  | "ROLE_USER"
  | "ROLE_PROJECT_LEADER"
  | "ROLE_COMPANY_ADMIN"
  | "ROLE_ADMIN";

const TOKEN_KEY = "sm.token";
const USER_KEY = "sm.user";

export type Session = {
  token: string;
  fullName: string;
  role: Role;
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    const u = JSON.parse(userRaw);
    return { token, fullName: u.fullName, role: u.role };
  } catch {
    return null;
  }
}

export function setSession(s: Session): void {
  localStorage.setItem(TOKEN_KEY, s.token);
  localStorage.setItem(USER_KEY, JSON.stringify({ fullName: s.fullName, role: s.role }));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const useToken = token ?? getSession()?.token;
  if (useToken) headers["Authorization"] = `Bearer ${useToken}`;

  const res = await fetch(path, { ...init, headers });
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const jsonMsg =
      isJson && body && typeof body === "object" && "error" in body
        ? (body as { error: { message?: string } }).error?.message
        : undefined;
    const textMsg = typeof body === "string" && body ? body : undefined;
    const msg = jsonMsg ?? textMsg ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), body);
  }
  return body as T;
}

export const api = {
  get: <T,>(path: string, token?: string) => request<T>(path, { method: "GET" }, token),
  post: <T,>(path: string, data?: unknown, token?: string) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }, token),
  put: <T,>(path: string, data?: unknown, token?: string) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) }, token),
  del: <T,>(path: string, token?: string) =>
    request<T>(path, { method: "DELETE" }, token),
};
