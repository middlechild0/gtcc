"use client";

import { Button } from "@visyx/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { DashboardHeader } from "../../../_components/dashboard-header";

export default function PriceBookDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const canView = useHasPermission("pricing:view").allowed;
  const canManage = useHasPermission("pricing:manage").allowed;

  const priceBookId = Number(params.id);
  const utils = trpc.useUtils();

  const {
    data: bookData,
    isLoading: isLoadingBook,
    error: bookError,
    refetch: refetchBooks,
  } = trpc.pricing.listPriceBooks.useQuery(
    { limit: 100, cursor: undefined },
    { enabled: canView },
  );

  const priceBook = useMemo(() => {
    const list = bookData?.items ?? [];
    return list.find((b: any) => b.id === priceBookId) ?? null;
  }, [bookData, priceBookId]);

  const {
    data: entriesData,
    isLoading: isLoadingEntries,
    error: entriesError,
    refetch: refetchEntries,
  } = trpc.pricing.listEntries.useQuery(
    { priceBookId, limit: 100, cursor: undefined },
    { enabled: canView && Number.isFinite(priceBookId) },
  );

  const [search, setSearch] = useState("");
  const [draftPrices, setDraftPrices] = useState<Record<number, string>>({});

  const upsert = trpc.pricing.upsertEntry.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.pricing.listEntries.invalidate(),
        utils.pricing.listPriceBooks.invalidate(),
      ]);
    },
  });

  const { data: billable } = trpc.catalog.listBillableItems.useQuery(
    {
      limit: 100,
      cursor: undefined,
      search: search.trim() || undefined,
      isActive: true,
    },
    { enabled: canView },
  );

  const entryByBillableId = useMemo(() => {
    const map = new Map<number, any>();
    for (const e of entriesData?.items ?? []) {
      map.set(e.billableItemId, e);
    }
    return map;
  }, [entriesData]);

  const mergedRows = useMemo(() => {
    const items = billable?.items ?? [];
    return items.map((bi: any) => {
      const existing = entryByBillableId.get(bi.id);
      return {
        billableItem: bi,
        entry: existing ?? null,
      };
    });
  }, [billable, entryByBillableId]);

  const headerTitle = priceBook
    ? `Price book · ${priceBook.name}`
    : "Price book";

  return (
    <RouteGuard required="pricing:view">
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title={headerTitle}
          description="Set prices for billable items in this price book."
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh"
                onClick={() => {
                  void refetchBooks();
                  void refetchEntries();
                }}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          }
        />

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-base">Prices</CardTitle>
            <div className="grid gap-2">
              <Label htmlFor="bi-search">Search billable items</Label>
              <Input
                id="bi-search"
                type="search"
                placeholder="Search by item name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[180px]">Price</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingBook || isLoadingEntries) && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                      Loading...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingBook && bookError && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-destructive"
                    >
                      {bookError.message}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingEntries && entriesError && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-destructive"
                    >
                      {entriesError.message}
                    </TableCell>
                  </TableRow>
                )}

                {!isLoadingEntries &&
                  !entriesError &&
                  mergedRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-muted-foreground"
                      >
                        No billable items found.
                      </TableCell>
                    </TableRow>
                  )}

                {mergedRows.map(({ billableItem, entry }) => {
                  const current =
                    draftPrices[billableItem.id] ??
                    (entry ? String(entry.price) : "");
                  const parsed = current === "" ? NaN : Number(current);
                  const canSave =
                    canManage && Number.isFinite(parsed) && parsed >= 0;

                  return (
                    <TableRow key={billableItem.id}>
                      <TableCell className="font-medium">
                        {billableItem.name}
                      </TableCell>
                      <TableCell>{billableItem.type}</TableCell>
                      <TableCell>
                        <Input
                          inputMode="numeric"
                          value={current}
                          onChange={(e) =>
                            setDraftPrices((p) => ({
                              ...p,
                              [billableItem.id]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          disabled={!canManage}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canSave || upsert.isPending}
                          onClick={() => {
                            if (!canSave) return;
                            upsert.mutate({
                              priceBookId,
                              billableItemId: billableItem.id,
                              price: Number(current),
                            });
                          }}
                        >
                          {upsert.isPending ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 size-4" />
                          )}
                          Save
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
