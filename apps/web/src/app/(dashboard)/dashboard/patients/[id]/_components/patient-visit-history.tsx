"use client";

import { Badge } from "@visyx/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { format } from "date-fns";
import { trpc } from "@/trpc/client";
import { ConsultationNotes } from "./consultation-notes";

const ACTIVE_VISIT_STATUSES = new Set(["WAITING", "IN_PROGRESS", "ON_HOLD"]);

function getStatusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "WAITING") return "default";
  if (status === "IN_PROGRESS") return "outline";
  return "secondary";
}

type PatientVisitHistoryProps = {
  patientId: string;
  branchId?: number;
};

export function PatientVisitHistory({
  patientId,
  branchId,
}: PatientVisitHistoryProps) {
  const { data: visits, isLoading } = trpc.patients.getVisitHistory.useQuery({
    patientId,
    branchId,
    limit: 100,
    activeOnly: false,
  });

  const activeVisits =
    visits?.filter((visit) => ACTIVE_VISIT_STATUSES.has(visit.status)) ?? [];
  const activeVisit = activeVisits[0] ?? null;

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-md bg-muted" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visit History</CardTitle>
        <CardDescription>
          Current and past visits for this patient in the selected branch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeVisit ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getStatusVariant(activeVisit.status)}>
                Active Visit
              </Badge>
              <span className="font-medium text-sm">
                Ticket #{activeVisit.ticketNumber}
              </span>
              {activeVisits.length > 1 ? (
                <span className="text-muted-foreground text-xs">
                  ({activeVisits.length} active visits detected)
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {activeVisit.visitType.name} · {activeVisit.department.name} ·
              Started {format(new Date(activeVisit.registeredAt), "PPp")}
            </p>

            <div className="mt-4">
              <ConsultationNotes
                visitId={activeVisit.id}
                existingNotes={activeVisit.notes ?? null}
                visitStatus={activeVisit.status}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
            No active visit at the moment.
          </div>
        )}

        {!visits?.length ? (
          <p className="text-sm text-muted-foreground italic">
            No visits found for this patient.
          </p>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Visit Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-mono text-sm">
                      {visit.ticketNumber}
                    </TableCell>
                    <TableCell>{visit.visitType.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(visit.status)}>
                        {visit.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{visit.department.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          visit.priority === "URGENT" ? "default" : "secondary"
                        }
                      >
                        {visit.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(visit.registeredAt), "PPp")}
                    </TableCell>
                    <TableCell>
                      {visit.completedAt
                        ? format(new Date(visit.completedAt), "PPp")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
