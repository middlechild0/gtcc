import type { CashierInvoice } from "./types";

function escapeCsvCell(value: string | number) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function downloadCsvContent(params: {
  csvContent: string;
  fileName: string;
}) {
  const { csvContent, fileName } = params;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export function downloadInvoicesCsv(invoices: CashierInvoice[]) {
  if (invoices.length === 0) {
    return;
  }

  const headers = [
    "Invoice ID",
    "Patient",
    "Amount",
    "Payment Types",
    "Created At",
  ];

  const rows = invoices.map((invoice) => [
    invoice.id,
    invoice.patientName,
    invoice.amount.toFixed(2),
    invoice.paymentType.join(" | "),
    invoice.createdAt ? new Date(invoice.createdAt).toISOString() : "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\n");

  downloadCsvContent({
    csvContent: csv,
    fileName: `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
  });
}
