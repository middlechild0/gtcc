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
import type { Branch } from "../_utils/branch-types";
import { BranchStatusBadge } from "./branch-status-badge";

type BranchesTableProps = {
  branches: Branch[];
  isLoading: boolean;
  error: unknown;
  emptyMessage?: string;
};

export function BranchesTable({
  branches,
  isLoading,
  error,
  emptyMessage = "No branches found.",
}: BranchesTableProps) {
  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Failed to load branches. Please try again.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Address</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[100px] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && branches.length === 0 ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : branches.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="py-10 text-center text-muted-foreground text-sm"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          branches.map((branch) => (
            <TableRow key={branch.id} className="hover:bg-muted/50">
              <TableCell className="font-medium hover:underline">
                <Link href={`/dashboard/settings/branches/${branch.id}`}>
                  {branch.name}
                </Link>
              </TableCell>
              <TableCell className="max-w-xs truncate text-muted-foreground">
                {branch.address || "—"}
              </TableCell>
              <TableCell className="hover:underline">
                <Link href={`tel:${branch.phone}`}>{branch.phone || "—"}</Link>
              </TableCell>
              <TableCell className="text-muted-foreground hover:underline">
                <Link href={`mailto:${branch.email}`}>
                  {branch.email || "—"}
                </Link>
              </TableCell>
              <TableCell>
                <BranchStatusBadge isActive={branch.isActive} />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/settings/branches/${branch.id}`}>
                    View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

function SkeletonRow() {
  return (
    <TableRow className="animate-pulse">
      <TableCell className="py-4">
        <div className="h-4 w-32 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-44 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-28 rounded bg-muted" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-40 rounded bg-muted" />
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
