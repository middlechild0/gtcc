"use client";

import { Input } from "@visyx/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import type { Patient } from "../_utils/patient-types";

type PatientsTableProps = {
  patients: Patient[];
  isLoading: boolean;
  error: unknown;
  emptyMessage?: string;
  search: string;
  onSearchChange: (value: string) => void;
};

export function PatientsTable({
  patients,
  isLoading,
  error,
  emptyMessage = "No patients found.",
  search,
  onSearchChange,
}: PatientsTableProps) {
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load patients. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          type="search"
          placeholder="Search by name"
          className="h-9 w-full max-w-sm"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
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
              <TableCell className="py-10 text-center text-muted-foreground text-sm">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">
                  {patient.firstName} {patient.lastName}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="py-4">
        <div className="h-4 w-32 rounded bg-muted" />
      </TableCell>
    </TableRow>
  );
}

