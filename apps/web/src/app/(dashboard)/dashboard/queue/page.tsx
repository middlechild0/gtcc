"use client";

import { useBranch } from "../branch-context";
import { trpc } from "@/trpc/client";
import { QueueDepartmentCard } from "./_components/queue-department-card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@visyx/ui/alert";

export default function QueueGlobalOverviewPage() {
    const { activeBranchId: branchId } = useBranch();

    const { data, isLoading, error } = trpc.queue.getGlobalOverview.useQuery(
        { branchId: branchId as number },
        {
            enabled: !!branchId,
            staleTime: 0, // Always rely on live data invalidated by Realtime
        }
    );

    if (isLoading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground animate-pulse">Loading Live Queue...</p>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="max-w-xl mx-auto mt-8">
                <AlertTitle>Error Loading Queue</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    const departments = data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Queue Overview</h1>
                    <p className="text-muted-foreground">
                        Live patient progress and waitlist times across all departments.
                    </p>
                </div>
            </div>

            {departments.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-24 text-muted-foreground rounded-lg border border-dashed">
                    <p className="text-lg">No active patients in the queue for today.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                    {departments.map((dept) => (
                        <div key={dept.code} className="min-w-0">
                            <QueueDepartmentCard
                                department={dept}
                                onClickPatient={(patient) => {
                                    // TODO: Open action drawer/dialog when clicking a patient
                                    console.log("Clicked patient", patient);
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
