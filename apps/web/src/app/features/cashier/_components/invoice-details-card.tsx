"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import type { CashierInvoice } from "../_utils/types";

type InvoiceDetailsCardProps = {
  invoice: CashierInvoice | null | undefined;
  isLoading: boolean;
  errorMessage?: string;
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

export function InvoiceDetailsCard(props: InvoiceDetailsCardProps) {
  const { invoice, isLoading, errorMessage } = props;

  return (
    <Card className="mx-auto max-w-6xl">
      <CardHeader>
        <CardTitle>Invoice Details</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading invoice details...
          </p>
        ) : errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : !invoice ? (
          <p className="text-sm text-muted-foreground">No invoice selected.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Invoice ID</p>
              <p className="font-mono text-sm">{invoice.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Patient</p>
              <p className="text-sm">{invoice.patientName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="text-sm">{formatCurrency(invoice.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Payment Type</p>
              <p className="text-sm">{invoice.paymentType.join(", ") || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created At</p>
              <p className="text-sm">{formatDate(invoice.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created By</p>
              <p className="text-sm">{invoice.createdBy ?? "—"}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
