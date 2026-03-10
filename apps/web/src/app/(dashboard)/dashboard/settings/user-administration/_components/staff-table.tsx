"use client";

import { Button } from "@visyx/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import Link from "next/link";
import type { StaffListItem } from "../_utils/staff-types";
import { StaffStatusBadge } from "./staff-status-badge";

type StaffTableProps = {
  staff: StaffListItem[];
  isLoading: boolean;
  error: unknown;
  emptyMessage?: string;
};

export function StaffTable({
  staff,
  isLoading,
  error,
  emptyMessage = "No users found.",
}: StaffTableProps) {
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load users. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Job title</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {isLoading && staff.length === 0 ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : staff.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="py-10 text-center text-muted-foreground text-sm"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          staff.map((u) => (
            <TableRow key={u.id} className="hover:bg-muted/50">
              <TableCell className="font-medium hover:underline">
                <Link href={`/dashboard/settings/user-administration/${u.id}`}>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>{u.jobTitle || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {u.primaryBranchName || "—"}
              </TableCell>
              <TableCell>
                <StaffStatusBadge isActive={Boolean(u.isActive)} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={`/dashboard/settings/user-administration/${u.id}`}
                  >
                    View
                  </Link>
                </Button>
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
        <div className="h-4 w-40 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-52 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-32 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-36 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-5 w-16 rounded-full bg-muted" />
      </TableCell>
      <TableCell className="text-right">
        <div className="ml-auto h-8 w-16 rounded bg-muted" />
      </TableCell>
    </TableRow>
  );
}
