"use client";

import { useEffect } from "react";
import { createClient } from "@visyx/supabase/client";
import { trpc } from "@/trpc/client";
import { useBranch } from "../branch-context";

/**
 * A layout-level hook that maintains a single active WebSocket connection
 * to Supabase Realtime for the `visits` queue. 
 * 
 * When a queue change occurs (a visit is inserted or updated for the active branch),
 * this hook invalidates the necessary React Query cache layers using TRPC,
 * triggering a background refetch to keep the queue seamlessly up-to-date.
 */
export function useQueueSubscription() {
    const utils = trpc.useUtils();
    const { activeBranchId: branchId } = useBranch();

    useEffect(() => {
        // We only want to subscribe inside a valid clinic branch
        if (!branchId) return;

        const supabase = createClient();

        // Supabase allows us to listen to particular tables and row-level patterns
        const channel = supabase
            .channel("active-queue-subscription")
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to INSERT, UPDATE, DELETE
                    schema: "public",
                    table: "visits",
                    filter: `branch_id=eq.${branchId}`,
                },
                (payload: unknown) => {
                    // Whenever a visit changes, invalidate the queue pooling fetching caches
                    console.log("[Queue] Realtime Update Revieved:", payload);
                    utils.queue.getDepartmentPool.invalidate();
                    utils.queue.getGlobalOverview.invalidate();
                }
            )
            .subscribe();

        return () => {
            // Clean up the WebSocket listener if branch changes or component unmounts
            void supabase.removeChannel(channel);
        };
    }, [branchId, utils.queue]);
}
