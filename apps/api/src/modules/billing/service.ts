import { db } from "@visyx/db/client";
import { invoices, patients, staff, userProfiles } from "@visyx/db/schema";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type {
  CreateInvoiceInput,
  ExportInvoicesCsvInput,
  GenerateReceiptInput,
  GetInvoiceInput,
  ListInvoicesInput,
} from "./schemas";

type CreateInvoiceParams = {
  input: CreateInvoiceInput;
  authUserId: string | null;
};

type InvoiceRow = {
  id: string;
  patientId: string;
  amount: string;
  paymentType: unknown;
  createdBy: string | null;
  createdAt: Date | null;
  patientFirstName: string | null;
  patientLastName: string | null;
};

function normalizePaymentType(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function toInvoiceOutput(invoice: InvoiceRow) {
  return {
    id: invoice.id,
    patientId: invoice.patientId,
    patientName:
      [invoice.patientFirstName, invoice.patientLastName]
        .filter(Boolean)
        .join(" ") || "Unknown patient",
    amount: Number(invoice.amount ?? 0),
    paymentType: normalizePaymentType(invoice.paymentType),
    createdBy: invoice.createdBy,
    createdAt: invoice.createdAt,
  };
}

function escapeCsvCell(value: string | number) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function buildInvoiceWhereClause(input: {
  search?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const searchTerm = input.search?.trim();
  const searchPattern = searchTerm ? `%${searchTerm}%` : undefined;
  const fromDateValue = input.fromDate
    ? startOfDay(new Date(input.fromDate))
    : undefined;
  const toDateValue = input.toDate
    ? endOfDay(new Date(input.toDate))
    : undefined;

  const searchClause = searchPattern
    ? or(
        ilike(sql<string>`${invoices.id}::text`, searchPattern),
        ilike(sql<string>`${invoices.amount}::text`, searchPattern),
        ilike(sql<string>`${invoices.paymentType}::text`, searchPattern),
        ilike(patients.firstName, searchPattern),
        ilike(patients.lastName, searchPattern),
        ilike(
          sql<string>`concat(${patients.firstName}, ' ', ${patients.lastName})`,
          searchPattern,
        ),
      )
    : undefined;

  const dateClause = and(
    fromDateValue ? gte(invoices.createdAt, fromDateValue) : undefined,
    toDateValue ? lte(invoices.createdAt, toDateValue) : undefined,
  );

  return and(searchClause, dateClause);
}

export class BillingService {
  async createInvoice(params: CreateInvoiceParams) {
    const { input, authUserId } = params;

    await db
      .insert(invoices)
      .values({
        patientId: String(input.patientId),
        amount: String(input.amount),
        paymentType: input.paymentType,
        createdBy: authUserId,
        createdAt: new Date(),
      })
      .returning();

    return { success: true, message: "Invoice created" };
  }

  async listInvoices(input: ListInvoicesInput) {
    const { page, limit } = input;
    const whereClause = buildInvoiceWhereClause(input);

    const [countResult, results] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .leftJoin(patients, eq(patients.id, invoices.patientId))
        .where(whereClause),
      db
        .select({
          id: invoices.id,
          patientId: invoices.patientId,
          amount: invoices.amount,
          paymentType: invoices.paymentType,
          createdBy: invoices.createdBy,
          createdAt: invoices.createdAt,
          patientFirstName: patients.firstName,
          patientLastName: patients.lastName,
        })
        .from(invoices)
        .leftJoin(patients, eq(patients.id, invoices.patientId))
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
    ]);

    const total = countResult[0]?.count ?? 0;

    return {
      items: (results as InvoiceRow[]).map(toInvoiceOutput),
      total,
    };
  }

  async exportInvoicesCsv(input: ExportInvoicesCsvInput) {
    const whereClause = buildInvoiceWhereClause(input);

    const results = (await db
      .select({
        id: invoices.id,
        patientId: invoices.patientId,
        amount: invoices.amount,
        paymentType: invoices.paymentType,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
      })
      .from(invoices)
      .leftJoin(patients, eq(patients.id, invoices.patientId))
      .where(whereClause)
      .orderBy(desc(invoices.createdAt))) as InvoiceRow[];

    const invoicesForExport = results.map(toInvoiceOutput);

    const headers = [
      "Invoice ID",
      "Patient",
      "Amount",
      "Payment Types",
      "Created At",
    ];

    const rows = invoicesForExport.map((invoice) => [
      invoice.id,
      invoice.patientName,
      invoice.amount.toFixed(2),
      invoice.paymentType.join(" | "),
      invoice.createdAt ? new Date(invoice.createdAt).toISOString() : "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(","))
      .join("\n");

    return {
      fileName: `invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent,
      total: invoicesForExport.length,
    };
  }

  async getInvoiceById(input: GetInvoiceInput) {
    const [result] = (await db
      .select({
        id: invoices.id,
        patientId: invoices.patientId,
        amount: invoices.amount,
        paymentType: invoices.paymentType,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
      })
      .from(invoices)
      .leftJoin(patients, eq(patients.id, invoices.patientId))
      .where(eq(invoices.id, input.id))
      .limit(1)) as InvoiceRow[];

    if (!result) {
      return null;
    }

    return toInvoiceOutput(result);
  }

  async generateReceipt(input: GenerateReceiptInput) {
    // Fetch complete invoice details with patient and staff information
    const [invoiceData] = await db
      .select({
        invoiceId: invoices.id,
        amount: invoices.amount,
        paymentType: invoices.paymentType,
        invoiceCreatedAt: invoices.createdAt,
        patientId: patients.id,
        patientNumber: patients.patientNumber,
        patientFirstName: patients.firstName,
        patientLastName: patients.lastName,
        patientEmail: patients.email,
        patientPhone: patients.phone,
        staffUserId: userProfiles.userId,
        staffFirstName: userProfiles.firstName,
        staffLastName: userProfiles.lastName,
        staffJobTitle: staff.jobTitle,
      })
      .from(invoices)
      .leftJoin(patients, eq(patients.id, invoices.patientId))
      .leftJoin(userProfiles, eq(userProfiles.userId, invoices.createdBy))
      .leftJoin(staff, eq(staff.userId, userProfiles.userId))
      .where(eq(invoices.id, input.invoiceId))
      .limit(1);

    if (!invoiceData) {
      return null;
    }

    const paymentTypes = normalizePaymentType(invoiceData.paymentType);
    const totalAmount = Number(invoiceData.amount ?? 0);

    // Calculate tax (assuming 16% VAT - adjust as needed)
    const taxRate = 0.16;
    const subtotal = totalAmount / (1 + taxRate);
    const taxAmount = totalAmount - subtotal;

    const receiptData = {
      invoiceId: invoiceData.invoiceId,
      invoiceDate: invoiceData.invoiceCreatedAt
        ? new Date(invoiceData.invoiceCreatedAt).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A",
      patient: {
        number: invoiceData.patientNumber ?? "N/A",
        name:
          [invoiceData.patientFirstName, invoiceData.patientLastName]
            .filter(Boolean)
            .join(" ") || "Unknown Patient",
        email: invoiceData.patientEmail ?? "N/A",
        phone: invoiceData.patientPhone ?? "N/A",
      },
      staff: {
        name:
          [invoiceData.staffFirstName, invoiceData.staffLastName]
            .filter(Boolean)
            .join(" ") || "System",
        jobTitle: invoiceData.staffJobTitle ?? "Staff",
      },
      paymentTypes: paymentTypes.join(", "),
      subtotal: subtotal.toFixed(2),
      tax: taxAmount.toFixed(2),
      taxRate: (taxRate * 100).toFixed(0),
      total: totalAmount.toFixed(2),
    };

    const htmlContent = this.generateReceiptHtml(receiptData);

    return {
      invoiceId: invoiceData.invoiceId,
      format: input.format,
      content: htmlContent,
      fileName: `receipt-${invoiceData.invoiceId}.${input.format}`,
    };
  }

  private generateReceiptHtml(data: {
    invoiceId: string;
    invoiceDate: string;
    patient: {
      number: string;
      name: string;
      email: string;
      phone: string;
    };
    staff: {
      name: string;
      jobTitle: string;
    };
    paymentTypes: string;
    subtotal: string;
    tax: string;
    taxRate: string;
    total: string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${data.invoiceId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 20px;
    }
    .receipt {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .clinic-info {
      font-size: 14px;
      color: #666;
    }
    .receipt-title {
      text-align: center;
      font-size: 24px;
      font-weight: bold;
      margin: 20px 0;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .info-section {
      margin: 30px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-box {
      padding: 15px;
      background: #f9fafb;
      border-left: 3px solid #2563eb;
    }
    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .info-value {
      font-size: 14px;
      color: #333;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
    }
    .items-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals {
      margin-top: 30px;
      border-top: 2px solid #e5e7eb;
      padding-top: 20px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .total-row.grand {
      font-size: 20px;
      font-weight: bold;
      border-top: 2px solid #333;
      margin-top: 10px;
      padding-top: 15px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer-note {
      margin-top: 15px;
      font-style: italic;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .receipt {
        box-shadow: none;
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">VISYX</div>
      <div class="clinic-info">
        Optical Clinic Management System<br>
        <small>Professional Eye Care Services</small>
      </div>
    </div>

    <div class="receipt-title">Payment Receipt</div>

    <div class="info-section">
      <div class="info-box">
        <div class="info-label">Receipt #</div>
        <div class="info-value">${data.invoiceId.substring(0, 8).toUpperCase()}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Date</div>
        <div class="info-value">${data.invoiceDate}</div>
      </div>
      <div class="info-box">
        <div class="info-label">Patient</div>
        <div class="info-value">
          ${data.patient.name}<br>
          <small>${data.patient.number}</small>
        </div>
      </div>
      <div class="info-box">
        <div class="info-label">Served By</div>
        <div class="info-value">
          ${data.staff.name}<br>
          <small>${data.staff.jobTitle}</small>
        </div>
      </div>
    </div>

    <div class="info-section" style="grid-template-columns: 1fr;">
      <div class="info-box">
        <div class="info-label">Patient Contact</div>
        <div class="info-value">
          ${data.patient.email !== "N/A" ? `Email: ${data.patient.email}` : ""}<br>
          ${data.patient.phone !== "N/A" ? `Phone: ${data.patient.phone}` : ""}
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Medical Services</td>
          <td style="text-align: right;">$${data.subtotal}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>$${data.subtotal}</span>
      </div>
      <div class="total-row">
        <span>Tax (${data.taxRate}%):</span>
        <span>$${data.tax}</span>
      </div>
      <div class="total-row grand">
        <span>Total Amount:</span>
        <span>$${data.total}</span>
      </div>
      <div class="total-row" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <span>Payment Method:</span>
        <span style="text-transform: capitalize;">${data.paymentTypes.replace(/_/g, " ")}</span>
      </div>
    </div>

    <div class="footer">
      <div>Thank you for choosing VISYX Optical Clinic</div>
      <div class="footer-note">
        This receipt is computer-generated and serves as proof of payment.<br>
        For any queries, please contact our support team.
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}

export const billingService = new BillingService();
