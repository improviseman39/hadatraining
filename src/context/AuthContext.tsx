"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type Role = "super_admin" | "admin" | "user";

type AuthContextValue = {
  user: User | null;
  role: Role | null;
  /** Any authenticated user (regardless of role) unlocks member-gated sessions. */
  isMember: boolean;
  /** False until the first auth check resolves — avoids a locked/unlocked flash. */
  isReady: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // No Supabase project connected yet (.env.local not filled in) — stay
    // in a "logged out" state instead of throwing. Once real credentials
    // are set this branch never runs.
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setIsReady(true);
      return;
    }

    const supabase = createClient();

    async function loadRole(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setRole((data?.role as Role) ?? null);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRole(session.user.id).finally(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadRole(session.user.id);
      } else {
        setRole(null);
      }
      setIsReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, role, isMember: role !== null, isReady, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
