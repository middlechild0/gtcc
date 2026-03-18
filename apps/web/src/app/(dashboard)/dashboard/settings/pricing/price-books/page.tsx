"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
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
import { DashboardHeader } from "../../_components/dashboard-header";
import {
  PriceBookDialog,
  type PriceBookType,
} from "../_components/price-book-dialog";
import { usePriceBooksList } from "../_hooks/use-price-books";

function typeLabel(t: PriceBookType) {
  if (t === "CASH") return "Cash";
  if (t === "INSURANCE") return "Insurance";
  return "Corporate";
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
                      {b.branch?.name ??
                        (b.branchId ? `Branch #${b.branchId}` : "Global")}
                      {b.insuranceProvider?.name
                        ? ` · ${b.insuranceProvider.name}`
                        : b.insuranceProviderId
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
