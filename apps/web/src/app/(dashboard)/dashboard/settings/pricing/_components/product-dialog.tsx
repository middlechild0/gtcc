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
import { useCatalogMutations } from "../_hooks/use-catalog";
import type { ProductCategory } from "../_utils/catalog-types";

export type ProductDialogInitial = {
  id: number;
  name: string;
  sku: string | null;
  category: ProductCategory;
  description: string | null;
  vatExempt: boolean;
  isActive: boolean;
};

export function ProductDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: ProductDialogInitial;
}) {
  const canManage = useHasPermission("catalog:manage").allowed;
  const { createProduct, updateProduct } = useCatalogMutations();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [category, setCategory] = useState<ProductCategory>(
    initial?.category ?? "FRAME",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [vatExempt, setVatExempt] = useState(initial?.vatExempt ?? false);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const isSaving = createProduct.isPending || updateProduct.isPending;

  const resetForm = () => {
    setName("");
    setSku("");
    setCategory("FRAME");
    setDescription("");
    setVatExempt(false);
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
          <DialogTitle>{initial ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Products automatically become billable items for pricing and
            invoicing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-2 sm:p-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label>SKU (optional)</Label>
            <Input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ProductCategory)}
              disabled={!canManage || isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "FRAME",
                  "LENS",
                  "CONTACT_LENS",
                  "ACCESSORY",
                  "MEDICATION",
                  "CONSUMABLE",
                  "OTHER",
                ].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">VAT exempt</div>
              <div className="text-sm text-muted-foreground">
                If disabled, VAT will be calculated using the default tax rate.
              </div>
            </div>
            <Switch
              checked={vatExempt}
              onCheckedChange={setVatExempt}
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="font-medium">Active</div>
              <div className="text-sm text-muted-foreground">
                Inactive products won’t be selectable for new work.
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
            disabled={!canManage || isSaving || !name.trim()}
            onClick={async () => {
              if (!canManage || !name.trim()) return;
              const payload = {
                name: name.trim(),
                sku: sku.trim() || undefined,
                category,
                description: description.trim() || undefined,
                vatExempt,
                isActive,
              } as const;
              try {
                if (initial) {
                  await updateProduct.mutateAsync({
                    id: initial.id,
                    ...payload,
                  });
                } else {
                  await createProduct.mutateAsync(payload as any);
                  resetForm();
                }
                setOpen(false);
              } catch {
                // keep open; hook toasts error
              }
            }}
            isSubmitting={isSaving}
          >
            Save
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
