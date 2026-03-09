"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useToast } from "@visyx/ui/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@visyx/ui/dropdown-menu";
import { Button } from "@visyx/ui/button";
import { MoreVertical, Play, FastForward, ArrowRightLeft, AlertTriangle, XCircle } from "lucide-react";
import type { QueuePatient } from "./queue-department-card";

interface QueuePatientActionsProps {
    patient: QueuePatient;
}

export function QueuePatientActions({ patient }: QueuePatientActionsProps) {
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    // Hook up trpc mutations
    const utils = trpc.useUtils();

    const callPatientMut = trpc.queue.callPatient.useMutation({
        onSuccess: () => {
            toast({ title: "Patient Called", description: `${patient.patientName} has been called.` });
            utils.queue.invalidate();
            setIsOpen(false);
        },
        onError: (err) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        },
    });

    const advancePatientMut = trpc.queue.advanceWorkflow.useMutation({
        onSuccess: () => {
            toast({ title: "Patient Advanced", description: `${patient.patientName} has been moved to the next step.` });
            utils.queue.invalidate();
            setIsOpen(false);
        },
        onError: (err) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        },
    });

    const markUrgentMut = trpc.queue.markUrgent.useMutation({
        onSuccess: () => {
            toast({ title: "Marked Urgent", description: `${patient.patientName} priority updated.` });
            utils.queue.invalidate();
            setIsOpen(false);
        },
        onError: (err) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        },
    });

    const cancelVisitMut = trpc.queue.cancelVisit.useMutation({
        onSuccess: () => {
            toast({ title: "Visit Cancelled", description: `${patient.patientName}'s visit was cancelled.` });
            utils.queue.invalidate();
            setIsOpen(false);
        },
        onError: (err) => {
            toast({ title: "Action Failed", description: err.message, variant: "destructive" });
        },
    });

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuLabel>Actions: Ticket {patient.ticketNumber}</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {patient.status === "WAITING" && (
                    <DropdownMenuItem
                        disabled={callPatientMut.isPending}
                        onClick={(e) => {
                            e.stopPropagation();
                            callPatientMut.mutate({ visitId: patient.id });
                        }}
                    >
                        <Play className="mr-2 h-4 w-4 text-primary" />
                        <span>Call Patient</span>
                    </DropdownMenuItem>
                )}

                {patient.status === "IN_PROGRESS" && (
                    <DropdownMenuItem
                        disabled={advancePatientMut.isPending}
                        onClick={(e) => {
                            e.stopPropagation();
                            advancePatientMut.mutate({ visitId: patient.id });
                        }}
                    >
                        <FastForward className="mr-2 h-4 w-4 text-green-500" />
                        <span>Advance Workflow</span>
                    </DropdownMenuItem>
                )}

                {/* Transfer is a dialog operation ideally, for now just a placeholder hook */}
                <DropdownMenuItem
                    onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "Transfer Options", description: "Transfer UI coming soon." });
                    }}
                >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    <span>Transfer (Override)</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {patient.priority !== "URGENT" && (
                    <DropdownMenuItem
                        disabled={markUrgentMut.isPending}
                        onClick={(e) => {
                            e.stopPropagation();
                            markUrgentMut.mutate({ visitId: patient.id });
                        }}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                        <span>Mark Urgent</span>
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem
                    disabled={cancelVisitMut.isPending}
                    onClick={(e) => {
                        e.stopPropagation();
                        cancelVisitMut.mutate({ visitId: patient.id });
                    }}
                    className="text-destructive focus:text-destructive"
                >
                    <XCircle className="mr-2 h-4 w-4" />
                    <span>Cancel Visit</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
