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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@visyx/ui/select";
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
import Link from "next/link";
import { useMemo, useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { DashboardHeader } from "../../_components/dashboard-header";
import {
  usePriceBookMutations,
  usePriceBooksList,
} from "../_hooks/use-price-books";

type PriceBookType = "CASH" | "INSURANCE" | "CORPORATE";

function typeLabel(t: PriceBookType) {
  if (t === "CASH") return "Cash";
  if (t === "INSURANCE") return "Insurance";
  return "Corporate";
}

function PriceBookDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    type: PriceBookType;
    branchId: number | null;
    insuranceProviderId: number | null;
    isActive: boolean;
  };
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
  const { data: providers } = trpc.billing.insurance.listProviders.useQuery({
    includeInactive: false,
  });

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

        <div className="grid gap-4 py-2">
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
                {branches?.items?.map((b: any) => (
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
                {providers?.items?.map((p: any) => (
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
            onClick={() => setOpen(false)}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
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

              if (initial) {
                update.mutate({ id: initial.id, ...payload });
              } else {
                create.mutate(payload);
              }
              setOpen(false);
            }}
            disabled={!canManage || isSaving || !name.trim()}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PriceBooksPage() {
  const canManage = useHasPermission("pricing:manage").allowed;

  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data, isLoading, error, refetch } = usePriceBooksList({
    isActive: includeInactive ? undefined : true,
  });

  const items = useMemo(() => {
    const list = data?.items ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((b: any) =>
      String(b.name ?? "")
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);

  return (
    <RouteGuard required="pricing:view">
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title="Price books"
          description="Create and manage price books used to price services and products."
          action={
            <div className="flex items-center gap-2">
              <PriceBookDialog
                trigger={
                  <Button disabled={!canManage}>
                    <Plus className="mr-2 size-4" />
                    New price book
                  </Button>
                }
              />
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh price books"
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-base">Price books</CardTitle>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Input
                type="search"
                placeholder="Search price books"
                className="h-9 w-full max-w-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Switch
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={setIncludeInactive}
                />
                <label
                  htmlFor="include-inactive"
                  className="text-muted-foreground text-sm"
                >
                  Include inactive
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Scope</TableHead>
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
                      Loading price books...
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
                        ? "No price books match your search."
                        : "No price books found."}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{typeLabel(b.type)}</TableCell>
                    <TableCell>
                      {b.branchId ? `Branch #${b.branchId}` : "Global"}
                      {b.insuranceProviderId
                        ? ` · Provider #${b.insuranceProviderId}`
                        : ""}
                    </TableCell>
                    <TableCell>{b.isActive ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/dashboard/settings/pricing/price-books/${b.id}`}
                          >
                            Manage prices
                          </Link>
                        </Button>
                        <PriceBookDialog
                          initial={b}
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
                      </div>
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
