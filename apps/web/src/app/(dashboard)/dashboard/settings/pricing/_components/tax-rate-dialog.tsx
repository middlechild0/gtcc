"use client";

import { Button } from "@visyx/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@visyx/ui/dialog";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Switch } from "@visyx/ui/switch";
import { useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { useTaxRateMutations } from "../_hooks/use-tax-rates";

export type TaxRateDialogInitial = {
  id: number;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
};

export function TaxRateDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: TaxRateDialogInitial;
}) {
  const canManage = useHasPermission("pricing:manage").allowed;
  const { create, update } = useTaxRateMutations();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [rate, setRate] = useState<string>(
    initial ? String(initial.rate) : "16",
  );
  const [isDefault, setIsDefault] = useState<boolean>(
    initial?.isDefault ?? false,
  );
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

  const isSaving = create.isPending || update.isPending;

  const resetForm = () => {
    setName("");
    setRate("16");
    setIsDefault(false);
    setIsActive(true);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!canManage) return;
        if (isSaving) return;
        if (v && !initial) resetForm();
        setOpen(v);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit tax rate" : "New tax rate"}
          </DialogTitle>
          <DialogDescription>
            Tax rates are used to compute VAT for non-exempt services/products.
            Only one rate can be default at a time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-2 sm:p-4">
          <div className="grid gap-2">
            <Label htmlFor="tr-name">Name</Label>
            <Input
              id="tr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard VAT (16%)"
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tr-rate">Rate (%)</Label>
            <Input
              id="tr-rate"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Default</div>
              <div className="text-sm text-muted-foreground">
                Used when calculating VAT automatically.
              </div>
            </div>
            <Switch
              checked={isDefault}
              onCheckedChange={setIsDefault}
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Active</div>
              <div className="text-sm text-muted-foreground">
                Inactive rates are kept for history.
              </div>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={!canManage || isSaving}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (isSaving) return;
              setOpen(false);
            }}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </Button>
          <SubmitButton
            onClick={async () => {
              if (!canManage) return;
              const parsedRate = Number(rate);
              if (!name.trim() || Number.isNaN(parsedRate)) return;
              const payload = {
                name: name.trim(),
                rate: parsedRate,
                isDefault,
                isActive,
              } as const;
              try {
                if (initial) {
                  await update.mutateAsync({ id: initial.id, ...payload });
                } else {
                  await create.mutateAsync(payload);
                  resetForm();
                }
                setOpen(false);
              } catch {
                // keep open; hook toasts error
              }
            }}
            disabled={
              !canManage ||
              isSaving ||
              !name.trim() ||
              Number.isNaN(Number(rate))
            }
            isSubmitting={isSaving}
          >
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
