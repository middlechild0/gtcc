export type CashierOption = {
  id: string;
  label: string;
};

export type CashierPatientOption = {
  id: string;
  name: string;
};

export type CashierFormErrors = {
  patientId?: string;
  amount?: string;
  paymentType?: string;
};

export type CashierInvoice = {
  id: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentType: string[];
  createdBy: string | null;
  createdAt: Date | null;
};
