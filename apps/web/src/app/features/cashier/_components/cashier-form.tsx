"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import type {
  CashierFormErrors,
  CashierOption,
  CashierPatientOption,
} from "../_utils/types";

type CashierFormProps = {
  patients: CashierPatientOption[];
  items: CashierOption[];
  paymentTypes: ReadonlyArray<{ id: string; label: string }>;
  patientId: string;
  charges: string;
  item: string;
  paymentType: string;
  errors: CashierFormErrors;
  isPatientsLoading: boolean;
  isItemsLoading: boolean;
  isSubmitting: boolean;
  loadErrorMessage?: string;
  onPatientChange: (value: string) => void;
  onChargesChange: (value: string) => void;
  onItemChange: (value: string) => void;
  onPaymentTypeChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export function CashierForm(props: CashierFormProps) {
  const {
    patients,
    items,
    paymentTypes,
    patientId,
    charges,
    item,
    paymentType,
    errors,
    isPatientsLoading,
    isItemsLoading,
    isSubmitting,
    loadErrorMessage,
    onPatientChange,
    onChargesChange,
    onItemChange,
    onPaymentTypeChange,
    onSubmit,
  } = props;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Cashier</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="patient" className="block">
                Patient
              </Label>
              <Select
                value={patientId}
                onValueChange={onPatientChange}
                disabled={isPatientsLoading || isSubmitting}
              >
                <SelectTrigger id="patient" className="w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patientId ? (
                <p className="text-sm text-destructive">{errors.patientId}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="charges" className="block">
                Charges
              </Label>
              <Input
                id="charges"
                type="number"
                value={charges}
                onChange={(event) => onChargesChange(event.target.value)}
                placeholder="Enter charges"
                disabled={isSubmitting}
                className="w-full"
              />
              {errors.amount ? (
                <p className="text-sm text-destructive">{errors.amount}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="item" className="block">
                Item Bought
              </Label>
              <Select
                value={item}
                onValueChange={onItemChange}
                disabled={isItemsLoading || isSubmitting || items.length === 0}
              >
                <SelectTrigger id="item" className="w-full">
                  <SelectValue
                    placeholder={
                      items.length === 0 ? "No items available" : "Select item"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {items.map((inventoryItem) => (
                    <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                      {inventoryItem.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="paymentType" className="block">
                Payment Type
              </Label>
              <Select
                value={paymentType}
                onValueChange={onPaymentTypeChange}
                disabled={isSubmitting}
              >
                <SelectTrigger id="paymentType" className="w-full">
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.paymentType ? (
                <p className="text-sm text-destructive">{errors.paymentType}</p>
              ) : null}
            </div>
          </div>

          {loadErrorMessage ? (
            <p className="text-sm text-destructive">{loadErrorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Confirm Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
