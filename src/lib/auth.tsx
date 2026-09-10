import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { apiRequest, getToken, setToken } from "./api-client";
import type { PublicUser } from "./types";

interface AuthResult {
  user: PublicUser;
  token: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  status: "loading" | "authenticated" | "anonymous";
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: { fullName: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    let active = true;
    const token = getToken();
    if (!token) {
      setStatus("anonymous");
      return;
    }
    apiRequest<{ user: PublicUser }>("/api/auth/me")
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        setToken(null);
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      active = false;
    };
  }, []);

  const applyResult = useCallback(
    (result: AuthResult) => {
      setToken(result.token);
      setUser(result.user);
      setStatus("authenticated");
      queryClient.clear();
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const result = await apiRequest<AuthResult>("/api/auth/login", {
        method: "POST",
        body: input,
        auth: false,
      });
      applyResult(result);
    },
    [applyResult],
  );

  const register = useCallback(
    async (input: { fullName: string; email: string; password: string }) => {
      const result = await apiRequest<AuthResult>("/api/auth/register", {
        method: "POST",
        body: input,
        auth: false,
      });
      applyResult(result);
    },
    [applyResult],
  );

  const logout = useCallback(async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      /* the local session is cleared regardless */
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    setToken(null);
    setUser(null);
    setStatus("anonymous");
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
