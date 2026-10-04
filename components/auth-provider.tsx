"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { trpcReact } from "@/clients";
import { getToken, setToken, clearToken } from "@/lib/auth";

export interface AuthUser {
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [tokenHydrated, setTokenHydrated] = useState(false);
  const loginMut = trpcReact.auth.login.useMutation();
  const signupMut = trpcReact.auth.signup.useMutation();
  const registerMut = trpcReact.auth.register.useMutation();
  const logoutMut = trpcReact.auth.logout.useMutation();

  const me = trpcReact.auth.me.useQuery(undefined, {
    enabled: !!token,
    retry: false,
  });

  // Read the persisted session token once on mount.
  useEffect(() => {
    setTokenState(getToken());
    setTokenHydrated(true);
  }, []);

  // Session expiry / revocation: the server rejected the token.
  // Clear the stale local token and send the user back to login.
  useEffect(() => {
    if (me.isError && token) {
      clearToken();
      setTokenState(null);
      router.replace("/login");
    }
  }, [me.isError, token, router]);

  const persist = useCallback((t: string) => {
    setToken(t);
    setTokenState(t);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginMut.mutateAsync({ email, password });
      persist(res.token);
    },
    [loginMut, persist],
  );

  const signup = useCallback(
    async (input: {
      email: string;
      password: string;
      name?: string;
      orgName: string;
      orgSlug: string;
    }) => {
      const res = await signupMut.mutateAsync(input);
      persist(res.token);
    },
    [signupMut, persist],
  );

  const registerAndJoin = useCallback(
    async (input: {
      email: string;
      password: string;
      name?: string;
      orgSlug: string;
    }) => {
      const res = await registerMut.mutateAsync(input);
      persist(res.token);
    },
    [registerMut, persist],
  );

  const logout = useCallback(async () => {
    const currentToken = token;
    // Clear the local session first so a failed server call
    // cannot leave the user signed in.
    clearToken();
    setTokenState(null);
    // Disabling the query does NOT discard its cached data, so without this
    // `me.data` survives logout: isAuthenticated stays true, the login page
    // bounces straight back to /legalai, and a shared browser briefly renders
    // the previous account's role and organisation.
    queryClient.removeQueries({ queryKey: ["auth", "me"] });
    if (currentToken) {
      try {
        await logoutMut.mutateAsync({ token: currentToken });
      } catch {
        // Local session is already gone; ignore server errors.
      }
    }
    router.push("/login");
  }, [token, logoutMut, queryClient, router]);

  const value: AuthContextValue = {
    user: (me.data as AuthUser | undefined) ?? null,
    isLoading: !tokenHydrated || (!!token && me.isLoading),
    isAuthenticated: !!me.data,
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
