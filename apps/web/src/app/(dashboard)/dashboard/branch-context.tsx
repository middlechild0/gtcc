"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { RouterOutputs } from "@/trpc/client";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/app/auth/_hooks/use-auth";

type Branch = RouterOutputs["branches"]["list"][number];

type BranchContextValue = {
  branches: Branch[];
  activeBranchId: number | null;
  setActiveBranchId: (id: number | null) => void;
  isLoading: boolean;
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
  const { staff } = useAuth();
  const utils = trpc.useUtils();

  const [activeBranchId, setActiveBranchIdState] = useState<number | null>(
    () => getBranchIdFromCookie(),
  );

  const {
    data: branches,
    isLoading,
    error,
  } = trpc.branches.list.useQuery(
    { includeInactive: false },
    {
      staleTime: 60_000,
    },
  );

  const setActiveBranchId = useCallback(
    (id: number | null) => {
      setActiveBranchIdState(id);
      setBranchIdCookie(id);
      // After updating the cookie, invalidate auth.me so permissions refresh
      // with the new x-branch-id header.
      void utils.auth.me.invalidate();
    },
    [utils],
  );

  // Validate and normalize initial branch_id from cookie against the active branches list.
  useEffect(() => {
    if (!branches) return;

    const activeBranches = branches.filter((b) => b.isActive);
    const activeIds = new Set(activeBranches.map((b) => b.id));

    let nextId = activeBranchId;

    // Drop invalid cookie value (branch no longer exists or is inactive).
    if (nextId != null && !activeIds.has(nextId)) {
      nextId = null;
    }

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
      setActiveBranchId(nextId);
    }
  }, [branches, staff?.primaryBranchId, activeBranchId, setActiveBranchId]);

  const value: BranchContextValue = useMemo(
    () => ({
      branches: branches ?? [],
      activeBranchId,
      setActiveBranchId,
      isLoading,
      error,
    }),
    [branches, activeBranchId, setActiveBranchId, isLoading, error],
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

