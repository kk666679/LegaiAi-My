"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { trpcReact } from "@/clients";
import { getToken, setToken, clearToken } from "@/lib/auth";

interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  orgId?: string | null;
  org?: { id: string; name: string; slug: string; plan: string } | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    email: string;
    password: string;
    name?: string;
    orgName: string;
    orgSlug: string;
  }) => Promise<void>;
  registerAndJoin: (input: {
    email: string;
    password: string;
    name?: string;
    orgSlug: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [token, setTokenState] = useState<string | null>(null);
  const loginMut = trpcReact.auth.login.useMutation();
  const signupMut = trpcReact.auth.signup.useMutation();
  const registerMut = trpcReact.auth.register.useMutation();
  const logoutMut = trpcReact.auth.logout.useMutation();

  const me = trpcReact.auth.me.useQuery(undefined, { enabled: !!token });

  useEffect(() => {
    setTokenState(getToken());
  }, []);

  const persist = (t: string) => {
    setToken(t);
    setTokenState(t);
  };

  const login = async (email: string, password: string) => {
    const res = await loginMut.mutateAsync({ email, password });
    persist(res.token);
  };

  const signup = async (input: {
    email: string;
    password: string;
    name?: string;
    orgName: string;
    orgSlug: string;
  }) => {
    const res = await signupMut.mutateAsync(input);
    persist(res.token);
  };

  const registerAndJoin = async (input: {
    email: string;
    password: string;
    name?: string;
    orgSlug: string;
  }) => {
    const res = await registerMut.mutateAsync(input);
    persist(res.token);
  };

  const logout = () => {
    try {
      logoutMut.mutate({ token: token ?? "" });
    } catch {
      /* no-op */
    }
    clearToken();
    setTokenState(null);
    router.push("/login");
  };

  const value: AuthContextValue = {
    user: (me.data?.user as AuthUser) ?? null,
    isLoading: me.isLoading,
    isAuthenticated: !!me.data?.user,
    login,
    signup,
    registerAndJoin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
