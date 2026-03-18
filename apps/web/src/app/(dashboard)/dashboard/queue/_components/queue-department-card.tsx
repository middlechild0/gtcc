import { Badge } from "@visyx/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { ScrollArea } from "@visyx/ui/scroll-area";
import { Clock, AlertCircle, PlayCircle, User } from "lucide-react";
import { QueuePatientActions } from "./queue-patient-actions";

export type QueuePatient = {
    id: string;
    ticketNumber: string;
    status: "WAITING" | "IN_PROGRESS" | "ON_HOLD" | "DONE";
    priority: "NORMAL" | "URGENT";
    patientName: string;
};

interface QueueDepartmentCardProps {
    department: {
        name: string;
        code: string;
        patients: QueuePatient[];
    };
    onClickPatient?: (patient: QueuePatient) => void;
}

export function QueueDepartmentCard({
    department,
    onClickPatient,
}: QueueDepartmentCardProps) {
    // Simple sorts: In Progress first, then Urgent, then others
    const sortedPatients = [...department.patients].sort((a, b) => {
        if (a.status === "IN_PROGRESS" && b.status !== "IN_PROGRESS") return -1;
        if (b.status === "IN_PROGRESS" && a.status !== "IN_PROGRESS") return 1;
        if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
        if (b.priority === "URGENT" && a.priority !== "URGENT") return 1;
        // Fallback to alphabetical / ticket number roughly (if needed)
        return a.ticketNumber.localeCompare(b.ticketNumber);
    });

    return (
        <Card className="flex h-full flex-col border-border/50 shadow-sm transition-all">
            <CardHeader className="border-b bg-muted/20 pb-4 pt-5">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold tracking-tight">
                        {department.name}
                    </CardTitle>
                    <Badge variant="secondary" className="rounded-full px-2.5">
                        {department.patients.length} Waiting
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full max-h-[400px]">
                    {sortedPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3 py-10 text-muted-foreground">
                            <Clock className="size-8 opacity-20" />
                            <p className="text-sm">Queue is currently empty</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/50">
                            {sortedPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    onClick={() => onClickPatient?.(patient)}
                                    className={`flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50 ${patient.status === "IN_PROGRESS"
                                        ? "bg-primary/5"
                                        : ""
                                        }`}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            onClickPatient?.(patient);
                                        }
                                    }}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold">
                                            {patient.ticketNumber}
                                        </div>
                                        <div>
                                            <p className="font-medium leading-none mb-1.5 flex items-center space-x-2">
                                                <span>{patient.patientName}</span>
                                                {patient.priority === "URGENT" && (
                                                    <AlertCircle className="size-3.5 text-destructive" />
                                                )}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                {patient.status === "IN_PROGRESS" ? (
                                                    <Badge variant="default" className="text-[10px] uppercase font-bold px-1.5 py-0">
                                                        <PlayCircle className="mr-1 size-3" />
                                                        Serving
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground py-0">
                                                        Waiting
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <QueuePatientActions patient={patient} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
