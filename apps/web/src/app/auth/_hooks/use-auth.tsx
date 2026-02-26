"use client";

import { createContext, useContext, useMemo } from "react";
import type { RouterOutputs } from "@/trpc/client";
import { trpc } from "@/trpc/client";
import type { PermissionKey } from "@/auth/permissions";

type AuthMe = RouterOutputs["auth"]["me"];

export type AuthContextValue = {
  profile: AuthMe["profile"] | null;
  staff: AuthMe["staff"] | null;
  permissions: AuthMe["permissions"];
  isSuperuser: boolean;
  isStaffAdmin: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: unknown;
  hasPermission: (
    required: PermissionKey | PermissionKey[],
    opts?: { requireAll?: boolean },
  ) => boolean;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading, error, refetch } = trpc.auth.me.useQuery(undefined, {
    // Permissions and identity are needed for most pages;
    // keep them reasonably fresh but avoid excessive chatter.
    staleTime: 30_000,
  });

  const value: AuthContextValue = useMemo(() => {
    const profile = data?.profile ?? null;
    const staff = data?.staff ?? null;
    const permissions = data?.permissions ?? [];

    const isSuperuser = Boolean(profile?.isSuperuser);
    const isStaffAdmin = Boolean(staff?.isAdmin);
    const isAuthenticated = Boolean(profile);

    const hasPermission = (
      required: PermissionKey | PermissionKey[],
      opts?: { requireAll?: boolean },
    ) => {
      // Superusers and staff admins implicitly have all permissions.
      if (isSuperuser || isStaffAdmin) return true;

      const keys = Array.isArray(required) ? required : [required];
      if (keys.length === 0) return true;

      const set = new Set(permissions);
      if (opts?.requireAll) {
        return keys.every((key) => set.has(key));
      }

      return keys.some((key) => set.has(key));
    };

    return {
      profile,
      staff,
      permissions,
      isSuperuser,
      isStaffAdmin,
      isAuthenticated,
      isLoading,
      error,
      hasPermission,
      refetch: () => {
        void refetch();
      },
    };
  }, [data, error, isLoading, refetch]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

