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
import type { Department } from "../_hooks/use-workflow-config";
import { DepartmentDialog } from "./department-dialog";

export function WorkflowDepartmentsTable({
  items,
  isLoading,
  error,
}: {
  items: Department[];
  isLoading: boolean;
  error?: string;
}) {
  const canManage = useHasPermission("queue:configure_workflows").allowed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Departments</CardTitle>
        <DepartmentDialog
          trigger={
            <Button disabled={!canManage}>
              <Plus className="mr-2 size-4" />
              New Department
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-muted-foreground"
                >
                  <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                  Loading departments...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && error && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !error && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  No departments configured.
                </TableCell>
              </TableRow>
            )}
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.code}</TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell>
                  <Badge variant={d.isActive ? "default" : "secondary"}>
                    {d.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DepartmentDialog
                    initial={d}
                    trigger={
                      <Button variant="ghost" size="sm" disabled={!canManage}>
                        Edit
                      </Button>
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
