"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/app/auth/_hooks/use-auth";
import type { RouterOutputs } from "@/trpc/client";
import { trpc } from "@/trpc/client";

type Branch = RouterOutputs["branches"]["list"][number];

type BranchContextValue = {
  branches: Branch[];
  activeBranchId: number | null;
  setActiveBranchId: (id: number | null) => void;
  isLoading: boolean;
  isBranchReady: boolean;
  error: unknown;
};

const BranchContext = createContext<BranchContextValue | null>(null);

const BRANCH_COOKIE_NAME = "branch_id";
const BRANCH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getBranchIdFromCookie(): number | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${BRANCH_COOKIE_NAME}=`);
  if (parts.length !== 2) return null;
  const raw = parts.pop()?.split(";").shift() ?? null;
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function setBranchIdCookie(id: number | null) {
  if (typeof document === "undefined") return;
  if (id == null) {
    document.cookie = `${BRANCH_COOKIE_NAME}=; path=/; max-age=0`;
    return;
  }
  document.cookie = `${BRANCH_COOKIE_NAME}=${id}; path=/; max-age=${BRANCH_COOKIE_MAX_AGE}`;
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const {
    staff,
    isSuperuser,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const utils = trpc.useUtils();

  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(() =>
    getBranchIdFromCookie(),
  );

  const {
    data: branches,
    isLoading,
    error,
  } = trpc.branches.list.useQuery(
    { includeInactive: false },
    {
      enabled: !authLoading && isAuthenticated,
      staleTime: 5 * 60_000,
      gcTime: 10 * 60_000,
    },
  );

  const applyActiveBranchId = useCallback(
    (id: number | null, opts: { invalidateAllQueries: boolean }) => {
      setActiveBranchIdState(id);
      setBranchIdCookie(id);

      // After updating the cookie, refresh auth.me so permissions update with the new x-branch-id header.
      void utils.auth.me.invalidate();

      // Branch-scoped queries are keyed without the branch id (it lives in headers),
      // so switching branches must invalidate cached results.
      if (opts.invalidateAllQueries) {
        void utils.invalidate();
      }
    },
    [utils],
  );

  const setActiveBranchId = useCallback(
    (id: number | null) => {
      applyActiveBranchId(id, { invalidateAllQueries: true });
    },
    [applyActiveBranchId],
  );

  // Validate and normalize initial branch_id from cookie against the active branches list.
  useEffect(() => {
    if (!branches) return;

    const activeBranches = branches.filter((b) => b.isActive);
    const activeIds = new Set(activeBranches.map((b) => b.id));

    let nextId = activeBranchId;
    let hadInvalidCookie = false;

    // Drop invalid cookie value (branch no longer exists or is inactive).
    if (nextId != null && !activeIds.has(nextId)) {
      nextId = null;
      hadInvalidCookie = true;
    }

    // If the cookie was invalid but we can't resolve a new branch yet (or don't need one),
    // clear it to avoid sending a non-existent branch id in headers.
    if (hadInvalidCookie && (authLoading || isSuperuser || staff == null)) {
      applyActiveBranchId(null, { invalidateAllQueries: false });
      return;
    }

    // If we don't have a valid cookie and auth is still loading, wait.
    // This avoids picking an arbitrary branch and then switching again once we learn staff.primaryBranchId.
    if (nextId == null && authLoading) return;

    // If the user has no staff record (or is a superuser), a null branch is valid.
    if (nextId == null && (isSuperuser || staff == null)) return;

    // Fallback to staff.primaryBranchId, then first active branch.
    if (nextId == null) {
      const primary = staff?.primaryBranchId ?? null;
      if (primary != null && activeIds.has(primary)) {
        nextId = primary;
      } else {
        nextId = activeBranches[0]?.id ?? null;
      }
    }

    if (nextId !== activeBranchId) {
      applyActiveBranchId(nextId, { invalidateAllQueries: false });
    }
  }, [
    branches,
    staff,
    isSuperuser,
    authLoading,
    activeBranchId,
    applyActiveBranchId,
  ]);

  const isActiveBranchValid = useMemo(() => {
    if (activeBranchId == null) return false;
    return (branches ?? []).some((b) => b.id === activeBranchId && b.isActive);
  }, [branches, activeBranchId]);

  // Ready when:
  // 1) branches have loaded, and a valid active branch is resolved, OR
  // 2) branches have loaded, and the user is superuser / has no staff record (null branch is valid), OR
  // 3) branches have loaded, and the list is empty (show empty state), OR
  // 4) branches have finished (error) so we shouldn't block the UI forever.
  const isBranchReady = useMemo(() => {
    if (isLoading) return false;
    if (authLoading) return false;

    if (error) return true;
    if ((branches ?? []).length === 0) return true;
    if (isSuperuser || staff == null) return true;

    return activeBranchId != null && isActiveBranchValid;
  }, [
    isLoading,
    authLoading,
    error,
    branches,
    isSuperuser,
    staff,
    activeBranchId,
    isActiveBranchValid,
  ]);

  const value: BranchContextValue = useMemo(
    () => ({
      branches: branches ?? [],
      activeBranchId,
      setActiveBranchId,
      isLoading,
      isBranchReady,
      error,
    }),
    [
      branches,
      activeBranchId,
      setActiveBranchId,
      isLoading,
      isBranchReady,
      error,
    ],
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return ctx;
}
