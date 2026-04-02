"use client";

import { Button } from "@visyx/ui/button";
import { useToast } from "@visyx/ui/use-toast";
import { useState } from "react";
import { trpc } from "@/trpc/client";

type PaymentMethod = "CASH" | "CARD" | "MPESA";

export default function BillingPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const { data: invoices, isLoading } = trpc.billing.listIssuedInvoices.useQuery(
    {},
    {
      refetchInterval: 15_000,
    },
  );

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<
    Record<string, PaymentMethod>
  >({});

  const recordPayment = trpc.billing.recordPayment.useMutation({
    onSuccess: async () => {
      toast({
        title: "Payment confirmed",
        description: "Invoice paid and visit marked complete.",
      });
      await utils.billing.listIssuedInvoices.invalidate();
    },
    onError: (err) => {
      toast({
        title: "Payment failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleConfirmPayment(invoiceId: string, amount: number) {
    const paymentMode = selectedMethod[invoiceId] ?? "CASH";
    setProcessingId(invoiceId);

    recordPayment.mutate(
      {
        invoiceId,
        amount,
        paymentMode,
      },
      {
        onSettled: () => setProcessingId(null),
      },
    );
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading invoices...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Cashier Pending Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Patients waiting for payment confirmation
        </p>
      </div>

      {!invoices || invoices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No invoices pending payment
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const patient = invoice.visit.patient;
            const isProcessing = processingId === invoice.id;
            const method = selectedMethod[invoice.id] ?? "CASH";

            return (
              <div
                key={invoice.id}
                className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {patient.firstName} {patient.lastName}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      #{patient.patientNumber}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Invoice: {invoice.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="min-w-[80px] text-right text-lg font-semibold tabular-nums">
                  KES {Number(invoice.totalAmount).toFixed(2)}
                </div>

                <select
                  className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={method}
                  disabled={isProcessing}
                  onChange={(event) =>
                    setSelectedMethod((prev) => ({
                      ...prev,
                      [invoice.id]: event.target.value as PaymentMethod,
                    }))
                  }
                >
                  <option value="CASH">Cash</option>
                  <option value="MPESA">M-Pesa</option>
                  <option value="CARD">Card</option>
                </select>

                <Button
                  className="min-w-[140px]"
                  disabled={isProcessing}
                  onClick={() =>
                    handleConfirmPayment(invoice.id, Number(invoice.totalAmount))
                  }
                >
                  {isProcessing ? "Processing..." : "Confirm Payment"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
