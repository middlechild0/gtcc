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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Switch } from "@visyx/ui/switch";
import { useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { trpc } from "@/trpc/client";
import { usePriceBookMutations } from "../_hooks/use-price-books";

export type PriceBookType = "CASH" | "INSURANCE" | "CORPORATE";

export type PriceBookDialogInitial = {
  id: number;
  name: string;
  type: PriceBookType;
  branchId: number | null;
  insuranceProviderId: number | null;
  isActive: boolean;
};

export function PriceBookDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: PriceBookDialogInitial;
}) {
  const canManage = useHasPermission("pricing:manage").allowed;
  const { create, update } = usePriceBookMutations();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<PriceBookType>(initial?.type ?? "CASH");
  const [branchId, setBranchId] = useState<string>(
    initial?.branchId ? String(initial.branchId) : "GLOBAL",
  );
  const [insuranceProviderId, setInsuranceProviderId] = useState<string>(
    initial?.insuranceProviderId ? String(initial.insuranceProviderId) : "NONE",
  );
  const [isActive, setIsActive] = useState<boolean>(initial?.isActive ?? true);

  const { data: branches } = trpc.branches.list.useQuery({
    includeInactive: false,
  });
  const { data: providers } = trpc.billing.insurance.listProviders.useQuery();

  const isSaving = create.isPending || update.isPending;

  const resetForm = () => {
    setName("");
    setType("CASH");
    setBranchId("GLOBAL");
    setInsuranceProviderId("NONE");
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {initial ? "Edit price book" : "New price book"}
          </DialogTitle>
          <DialogDescription>
            Price books define item prices for a payer type and optionally a
            specific branch or insurance provider.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-2 sm:p-4">
          <div className="grid gap-2">
            <Label htmlFor="pb-name">Name</Label>
            <Input
              id="pb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Standard Cash 2026"
              disabled={!canManage || isSaving}
            />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PriceBookType)}
              disabled={!canManage || isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="INSURANCE">Insurance</SelectItem>
                <SelectItem value="CORPORATE">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Branch scope</Label>
            <Select
              value={branchId}
              onValueChange={setBranchId}
              disabled={!canManage || isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global (all branches)</SelectItem>
                {branches?.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Insurance provider (optional)</Label>
            <Select
              value={insuranceProviderId}
              onValueChange={setInsuranceProviderId}
              disabled={!canManage || isSaving || type !== "INSURANCE"}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    type === "INSURANCE"
                      ? "Select provider"
                      : "Only for insurance books"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                {providers?.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Active</div>
              <div className="text-sm text-muted-foreground">
                Inactive books won’t be selected for new visits.
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
              const payload = {
                name: name.trim(),
                type,
                branchId: branchId === "GLOBAL" ? null : Number(branchId),
                insuranceProviderId:
                  type === "INSURANCE" && insuranceProviderId !== "NONE"
                    ? Number(insuranceProviderId)
                    : null,
                isActive,
              } as const;

              if (!payload.name) return;

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
            disabled={!canManage || isSaving || !name.trim()}
            isSubmitting={isSaving}
          >
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
