"use client";

import { Badge } from "@visyx/ui/badge";
import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { Loader2, Plus } from "lucide-react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import type { Department, VisitType } from "../_hooks/use-workflow-config";
import { VisitTypeDialog } from "./visit-type-dialog";

export function WorkflowVisitTypesTable({
  items,
  departments,
  isLoading,
  error,
}: {
  items: VisitType[];
  departments: Department[];
  isLoading: boolean;
  error?: string;
}) {
  const canManage = useHasPermission("queue:configure_workflows").allowed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Visit Types</CardTitle>
        <VisitTypeDialog
          departments={departments}
          trigger={
            <Button
              disabled={
                !canManage || departments.filter((d) => d.isActive).length === 0
              }
              title={
                departments.filter((d) => d.isActive).length === 0
                  ? "Activate at least one department to create a visit type"
                  : undefined
              }
            >
              <Plus className="mr-2 size-4" />
              New Visit Type
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Workflow Steps</TableHead>
              <TableHead>Default Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                  Loading visit types...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && error && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground"
                >
                  No visit types configured.
                </TableCell>
              </TableRow>
            )}
            {items.map((vt) => {
              const steps = ((vt.workflowSteps as string[] | null) ?? []).join(
                " -> ",
              );
              return (
                <TableRow key={vt.id}>
                  <TableCell className="font-medium">{vt.name}</TableCell>
                  <TableCell
                    className="max-w-[420px] truncate font-mono text-xs"
                    title={steps}
                  >
                    {steps}
                  </TableCell>
                  <TableCell>{vt.defaultServiceId ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={vt.isActive ? "default" : "secondary"}>
                      {vt.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <VisitTypeDialog
                      initial={vt}
                      departments={departments}
                      trigger={
                        <Button variant="ghost" size="sm" disabled={!canManage}>
                          Edit
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
