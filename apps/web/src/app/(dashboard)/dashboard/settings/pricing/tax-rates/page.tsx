"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
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
import { Switch } from "@visyx/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { DashboardHeader } from "../../_components/dashboard-header";
import { useTaxRateMutations, useTaxRates } from "../_hooks/use-tax-rates";

function TaxRateDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    rate: number;
    isDefault: boolean;
    isActive: boolean;
  };
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

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!canManage) return;
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

        <div className="grid gap-4 py-2">
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
            onClick={() => setOpen(false)}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!canManage) return;
              const parsedRate = Number(rate);
              if (!name.trim() || Number.isNaN(parsedRate)) return;
              const payload = {
                name: name.trim(),
                rate: parsedRate,
                isDefault,
                isActive,
              } as const;
              if (initial) update.mutate({ id: initial.id, ...payload });
              else create.mutate(payload);
              setOpen(false);
            }}
            disabled={
              !canManage ||
              isSaving ||
              !name.trim() ||
              Number.isNaN(Number(rate))
            }
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TaxRatesPage() {
  const canManage = useHasPermission("pricing:manage").allowed;

  const { data, isLoading, error, refetch } = useTaxRates();
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const list = data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((t: any) =>
      String(t.name ?? "")
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  return (
    <RouteGuard required="pricing:view">
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title="Tax rates"
          description="Manage VAT rates used during billing."
          action={
            <div className="flex items-center gap-2">
              <TaxRateDialog
                trigger={
                  <Button disabled={!canManage}>
                    <Plus className="mr-2 size-4" />
                    New tax rate
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh tax rates"
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-base">Tax rates</CardTitle>
            <Input
              type="search"
              placeholder="Search tax rates"
              className="h-9 w-full max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                      Loading tax rates...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && error && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-destructive"
                    >
                      {error.message}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && !error && items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {search
                        ? "No tax rates match your search."
                        : "No tax rates found."}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.rate}%</TableCell>
                    <TableCell>{t.isDefault ? "Yes" : "No"}</TableCell>
                    <TableCell>{t.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <TaxRateDialog
                        initial={t}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canManage}
                          >
                            Edit
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
