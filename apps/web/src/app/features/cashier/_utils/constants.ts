export const paymentTypes = [
  { id: "cash", label: "Cash" },
  { id: "credit_card", label: "Credit Card" },
  { id: "debit_card", label: "Debit Card" },
  { id: "bank_transfer", label: "Bank Transfer" },
  { id: "insurance", label: "Insurance" },
] as const;

export type PaymentTypeId = (typeof paymentTypes)[number]["id"];
