"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
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
import { TaxRateDialog } from "../_components/tax-rate-dialog";
import { useTaxRates } from "../_hooks/use-tax-rates";

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
