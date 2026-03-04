"use client";

import { trpc } from "@/trpc/client";
import type { CashierOption, CashierPatientOption } from "../_utils/types";

export function useCashierData() {
  const {
    data: patientsData,
    isLoading: isPatientsLoading,
    error: patientsError,
  } = trpc.patients.list.useQuery({
    page: 1,
    limit: 100,
  });

  const {
    data: inventoryItems,
    isLoading: isItemsLoading,
    error: itemsError,
  } = trpc.inventory.listItems.useQuery();

  const patients: CashierPatientOption[] = (patientsData?.items ?? []).map(
    (patient) => ({
      id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
    }),
  );

  const items: CashierOption[] = (inventoryItems ?? []).map(
    (inventoryItem) => ({
      id: String((inventoryItem as { id?: string }).id ?? ""),
      label: String(
        (inventoryItem as { label?: string; name?: string }).label ??
          (inventoryItem as { name?: string }).name ??
          "Inventory item",
      ),
    }),
  );

  return {
    patients,
    items,
    isPatientsLoading,
    isItemsLoading,
    loadError: patientsError ?? itemsError,
  };
}
