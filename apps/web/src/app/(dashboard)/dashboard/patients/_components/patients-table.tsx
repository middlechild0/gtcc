"use client";

import { Badge } from "@visyx/ui/badge";
import { Button } from "@visyx/ui/button";
import { Input } from "@visyx/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatAge } from "@/lib/age-formatter";
import type { Patient } from "../_utils/patient-types";

type PaginationState = {
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  setPageSize: (n: number) => void;
  totalPages: number;
  totalFiltered: number;
  pageSizeOptions: readonly number[];
};

type PatientsTableProps = {
  patients: Patient[];
  isLoading: boolean;
  error: unknown;
  emptyMessage?: string;
  search: string;
  onSearchChange: (value: string) => void;
  pagination?: PaginationState;
  totalFiltered: number;
};

export function PatientsTable({
  patients,
  isLoading,
  error,
  emptyMessage = "No patients found.",
  search,
  onSearchChange,
  pagination,
  totalFiltered,
}: PatientsTableProps) {
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load patients. Please try again.
      </div>
    );
  }

  const start = pagination
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 1;
  const end = pagination
    ? Math.min(pagination.page * pagination.pageSize, totalFiltered)
    : totalFiltered;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-4">
        <Input
          type="search"
          placeholder="Search by name or patient number"
          className="h-9 w-full max-w-sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient #</TableHead>
            <TableHead>First name</TableHead>
            <TableHead>Last name</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>National ID</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && patients.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : patients.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-muted-foreground text-sm"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-sm tabular-nums">
                  {patient.patientNumber ?? "—"}
                </TableCell>
                <TableCell className="font-medium">
                  {patient.firstName}
                </TableCell>
                <TableCell className="font-medium">
                  {patient.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                  {formatAge(patient.dateOfBirth)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {patient.phone ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {patient.nationalId ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={patient.isActive ? "default" : "secondary"}>
                    {patient.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {pagination && totalFiltered > 0 && (
        <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {start}–{end} of {totalFiltered}
            </span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => {
                pagination.setPageSize(Number(v));
                pagination.setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pagination.pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.setPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              aria-label="Next page"
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="py-4">
        <div className="h-4 w-24 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-16 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-6 w-16 rounded-full bg-muted" />
      </TableCell>
    </TableRow>
  );
}
