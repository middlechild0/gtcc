import { db } from "@visyx/db/client";
import { invoices, patients } from "@visyx/db/schema";
import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";
import type {
  CreateInvoiceInput,
  ExportInvoicesCsvInput,
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
}

export const billingService = new BillingService();
