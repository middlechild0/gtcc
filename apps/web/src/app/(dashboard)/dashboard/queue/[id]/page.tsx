"use client";

import { useBranch } from "../../branch-context";
import { trpc } from "@/trpc/client";
import { QueueDepartmentCard } from "../_components/queue-department-card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@visyx/ui/alert";
import { use, useMemo } from "react";

export default function DepartmentQueuePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: departmentCode } = use(params);
    const decodedDepartmentCode = decodeURIComponent(departmentCode);
    const { activeBranchId: branchId } = useBranch();

    // Fetch the specific department pool
    const { data, isLoading, error } = trpc.queue.getDepartmentPool.useQuery(
        {
            branchId: branchId as number,
            departmentCode: decodedDepartmentCode,
        },
        {
            enabled: !!branchId && !!decodedDepartmentCode,
            staleTime: 0, // Always live via realtime invalidation
        }
    );

    const parsedDepartment = useMemo(() => {
        return {
            name: decodedDepartmentCode, // Backend returns normalized data mapped; UI just displays this or a localized string
            code: decodedDepartmentCode,
            patients: (data ?? []).map(p => ({
                id: p.id,
                ticketNumber: p.ticketNumber,
                status: p.status,
                priority: p.priority,
                patientName: `${p.patient.firstName} ${p.patient.lastName}`,
            })),
        };
    }, [data, decodedDepartmentCode]);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground animate-pulse">Loading Department Queue...</p>
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

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Active Queue</h1>
                    <p className="text-muted-foreground uppercase tracking-widest text-xs mt-1 font-semibold">
                        {decodedDepartmentCode}
                    </p>
                </div>
            </div>

            <div className="h-full min-h-[500px]">
                <QueueDepartmentCard
                    department={parsedDepartment}
                    onClickPatient={(patient) => {
                        // TODO: Execute interactions like Call, Advance, Transfer
                        console.log("Clicked patient", patient);
                    }}
                />
            </div>
        </div>
    );
}
