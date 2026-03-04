"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { type PaymentTypeId, paymentTypes } from "../_utils/constants";
import type { CashierFormErrors } from "../_utils/types";

const validPaymentTypeIds = new Set(paymentTypes.map((type) => type.id));

export function useCashierForm() {
  const [patientId, setPatientIdState] = useState("");
  const [charges, setChargesState] = useState("");
  const [item, setItem] = useState("");
  const [paymentType, setPaymentTypeState] = useState("");
  const [errors, setErrors] = useState<CashierFormErrors>({});

  const utils = trpc.useUtils();

  const createInvoice = trpc.billing.createInvoice.useMutation({
    onSuccess: async (result) => {
      toast.success(result.message ?? "Payment recorded successfully");
      setPatientIdState("");
      setChargesState("");
      setItem("");
      setPaymentTypeState("");
      setErrors({});
      await utils.billing.listInvoices.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to record payment");
    },
  });

  const validateForm = () => {
    const nextErrors: CashierFormErrors = {};

    if (!patientId) {
      nextErrors.patientId = "Please select a patient";
    }

    const parsedAmount = Number(charges);
    if (!charges || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = "Enter a valid amount greater than 0";
    }

    if (
      !paymentType ||
      !validPaymentTypeIds.has(paymentType as PaymentTypeId)
    ) {
      nextErrors.paymentType = "Please select a payment type";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = () => {
    if (!validateForm()) {
      return;
    }

    createInvoice.mutate({
      patientId,
      amount: Number(charges),
      paymentType: [paymentType as PaymentTypeId],
    });
  };

  return {
    patientId,
    charges,
    item,
    paymentType,
    errors,
    isSubmitting: createInvoice.isPending,
    setPatientId: (value: string) => {
      setPatientIdState(value);
      if (errors.patientId) {
        setErrors((prev) => ({ ...prev, patientId: undefined }));
      }
    },
    setCharges: (value: string) => {
      setChargesState(value);
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: undefined }));
      }
    },
    setItem,
    setPaymentType: (value: string) => {
      setPaymentTypeState(value);
      if (errors.paymentType) {
        setErrors((prev) => ({ ...prev, paymentType: undefined }));
      }
    },
    submit,
  };
}
