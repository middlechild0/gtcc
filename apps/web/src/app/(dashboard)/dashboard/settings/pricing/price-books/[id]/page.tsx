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
import { Loader2, RefreshCw, Save, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { trpc } from "@/trpc/client";
import { DashboardHeader } from "../../../_components/dashboard-header";

export default function PriceBookDetailPage() {
  const params = useParams<{ id: string }>();
  const canView = useHasPermission("pricing:view").allowed;
  const canManage = useHasPermission("pricing:manage").allowed;

  const priceBookId = Number(params?.id);
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

  const bulkUpsert = trpc.pricing.bulkUpsertEntries.useMutation({
    onSuccess: async () => {
      setDraftPrices({});
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

  const hasChanges = Object.keys(draftPrices).length > 0;

  const headerTitle = priceBook
    ? `Price book · ${priceBook.name}`
    : "Price book";

  const handleSaveAll = () => {
    const entries = Object.entries(draftPrices)
      .map(([id, price]) => {
        const val = Number(price);
        if (isNaN(val) || val < 0) return null;
        return { billableItemId: Number(id), price: val };
      })
      .filter((e): e is { billableItemId: number; price: number } => e !== null);

    if (entries.length === 0) return;

    bulkUpsert.mutate({
      priceBookId,
      entries,
    });
  };

  return (
    <RouteGuard required="pricing:view">
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title={headerTitle}
          description="Set prices for billable items in this price book."
          action={
            <div className="flex items-center gap-2">
              {hasChanges && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraftPrices({})}
                    disabled={bulkUpsert.isPending}
                  >
                    <X className="mr-2 size-4" />
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={bulkUpsert.isPending}
                  >
                    {bulkUpsert.isPending ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 size-4" />
                    )}
                    Save all changes ({Object.keys(draftPrices).length})
                  </Button>
                </>
              )}
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
                  <TableHead className="w-[250px]">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoadingBook || isLoadingEntries) && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
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
                      colSpan={3}
                      className="py-8 text-center text-destructive"
                    >
                      {bookError.message}
                    </TableCell>
                  </TableRow>
                )}
                {!isLoadingEntries && entriesError && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
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
                        colSpan={3}
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
                  
                  const isChanged = draftPrices[billableItem.id] !== undefined;

                  return (
                    <TableRow key={billableItem.id} className={isChanged ? "bg-muted/30" : undefined}>
                      <TableCell className="font-medium">
                        {billableItem.name}
                      </TableCell>
                      <TableCell>{billableItem.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            inputMode="numeric"
                            value={current}
                            onChange={(e) => {
                                const val = e.target.value;
                                const original = entry ? String(entry.price) : "";
                                if (val === original) {
                                  const newDrafts = { ...draftPrices };
                                  delete newDrafts[billableItem.id];
                                  setDraftPrices(newDrafts);
                                } else {
                                  setDraftPrices((p) => ({
                                    ...p,
                                    [billableItem.id]: val,
                                  }));
                                }
                            }}
                            placeholder="0"
                            disabled={!canManage || bulkUpsert.isPending}
                            className={isChanged ? "border-primary" : ""}
                          />
                          {isChanged && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => {
                                    const newDrafts = { ...draftPrices };
                                    delete newDrafts[billableItem.id];
                                    setDraftPrices(newDrafts);
                                }}
                            >
                                <X className="size-4" />
                            </Button>
                          )}
                        </div>
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
