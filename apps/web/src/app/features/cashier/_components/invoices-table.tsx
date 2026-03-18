"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
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
import { Download } from "lucide-react";
import type { CashierInvoice } from "../_utils/types";

type PaginationState = {
  page: number;
  setPage: (value: number) => void;
  pageSize: number;
  setPageSize: (value: number) => void;
  total: number;
  totalPages: number;
  pageSizeOptions: readonly number[];
};

type InvoicesTableProps = {
  invoices: CashierInvoice[];
  isLoading: boolean;
  isFetching: boolean;
  isExporting: boolean;
  error: unknown;
  search: string;
  fromDate: string;
  toDate: string;
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onDownload: () => void;
  onViewDetails: (invoiceId: string) => void;
  pagination: PaginationState;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Date(date).toLocaleString();
}

export function InvoicesTable(props: InvoicesTableProps) {
  const {
    invoices,
    isLoading,
    isFetching,
    isExporting,
    error,
    search,
    fromDate,
    toDate,
    onSearchChange,
    onFromDateChange,
    onToDateChange,
    onDownload,
    onViewDetails,
    pagination,
  } = props;

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);

  return (
    <Card className="mx-auto max-w-6xl">
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              placeholder="Search by patient, amount, payment type, or invoice id"
              className="h-9 w-full max-w-md"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onDownload}
              disabled={isFetching || isExporting}
            >
              <Download className="size-4" />
              {isExporting ? "Exporting..." : "Download CSV"}
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              className="h-9 w-full sm:w-52"
              aria-label="From date"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              className="h-9 w-full sm:w-52"
              aria-label="To date"
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">
            Failed to load invoices. Please try again.
          </p>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Type</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm">
                  Loading invoices...
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-muted-foreground text-sm"
                >
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-xs">
                    {invoice.id}
                  </TableCell>
                  <TableCell>{invoice.patientName}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{invoice.paymentType.join(", ") || "—"}</TableCell>
                  <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(invoice.id)}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {pagination.total > 0 ? (
          <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {start}–{end} of {pagination.total}
              </span>
              <Select
                value={String(pagination.pageSize)}
                onValueChange={(value) => {
                  pagination.setPageSize(Number(value));
                  pagination.setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pagination.pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => pagination.setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
