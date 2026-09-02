"use client";

// Client-side session token holder. The token value itself is created and
// validated server-side by backend/src/lib/auth.ts (createSession /
// validateSession). The localStorage key is purely a client concern and does
// not need to match any backend field name.

const TOKEN_KEY = "lm_session_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
