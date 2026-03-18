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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { DashboardHeader } from "../../_components/dashboard-header";
import {
  useBillableItems,
  useCatalogMutations,
  useProducts,
  useServices,
} from "../_hooks/use-catalog";

type ServiceCategory =
  | "CONSULTATION"
  | "DIAGNOSTIC"
  | "OPTICAL"
  | "PROCEDURE"
  | "OTHER";
type ProductCategory =
  | "FRAME"
  | "LENS"
  | "CONTACT_LENS"
  | "ACCESSORY"
  | "MEDICATION"
  | "CONSUMABLE"
  | "OTHER";

function ServiceDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    category: ServiceCategory;
    description: string | null;
    vatExempt: boolean;
    isActive: boolean;
  };
}) {
  const canManage = useHasPermission("catalog:manage").allowed;
  const { createService, updateService } = useCatalogMutations();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<ServiceCategory>(
    initial?.category ?? "CONSULTATION",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [vatExempt, setVatExempt] = useState(initial?.vatExempt ?? true);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const isSaving = createService.isPending || updateService.isPending;

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
          <DialogTitle>{initial ? "Edit service" : "New service"}</DialogTitle>
          <DialogDescription>
            Services automatically become billable items for pricing and
            invoicing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canManage || isSaving}
            />
          </div>
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ServiceCategory)}
              disabled={!canManage || isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  "CONSULTATION",
                  "DIAGNOSTIC",
                  "OPTICAL",
                  "PROCEDURE",
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
                Inactive services won’t be selectable for new work.
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
            disabled={!canManage || isSaving || !name.trim()}
            onClick={() => {
              if (!canManage || !name.trim()) return;
              const payload = {
                name: name.trim(),
                category,
                description: description.trim() || undefined,
                vatExempt,
                isActive,
              } as const;
              if (initial) updateService.mutate({ id: initial.id, ...payload });
              else createService.mutate(payload as any);
              setOpen(false);
            }}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({
  trigger,
  initial,
}: {
  trigger: React.ReactNode;
  initial?: {
    id: number;
    name: string;
    sku: string | null;
    category: ProductCategory;
    description: string | null;
    vatExempt: boolean;
    isActive: boolean;
  };
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
          <DialogTitle>{initial ? "Edit product" : "New product"}</DialogTitle>
          <DialogDescription>
            Products automatically become billable items for pricing and
            invoicing.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
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
            onClick={() => setOpen(false)}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </Button>
          <Button
            disabled={!canManage || isSaving || !name.trim()}
            onClick={() => {
              if (!canManage || !name.trim()) return;
              const payload = {
                name: name.trim(),
                sku: sku.trim() || undefined,
                category,
                description: description.trim() || undefined,
                vatExempt,
                isActive,
              } as const;
              if (initial) updateProduct.mutate({ id: initial.id, ...payload });
              else createProduct.mutate(payload as any);
              setOpen(false);
            }}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PricingCatalogPage() {
  const canManage = useHasPermission("catalog:manage").allowed;

  const [serviceSearch, setServiceSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [billableSearch, setBillableSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const services = useServices(serviceSearch);
  const products = useProducts(productSearch);
  const billable = useBillableItems({
    search: billableSearch,
    isActive: includeInactive ? undefined : true,
  });

  const servicesItems = services.data?.items ?? [];
  const productsItems = products.data?.items ?? [];
  const billableItems = billable.data?.items ?? [];

  return (
    <RouteGuard required="catalog:view">
      <div className="flex flex-col gap-6">
        <DashboardHeader
          title="Catalog"
          description="Manage services and products that can be priced and invoiced."
          action={
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh catalog"
              onClick={() => {
                void services.refetch();
                void products.refetch();
                void billable.refetch();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          }
        />

        <Tabs defaultValue="services">
          <TabsList className="border border-border bg-muted/40 text-foreground">
            <TabsTrigger
              value="services"
              className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
            >
              Products
            </TabsTrigger>
            <TabsTrigger
              value="billable"
              className="text-muted-foreground hover:text-foreground data-[state=active]:text-foreground"
            >
              Billable items
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Services</CardTitle>
                  <ServiceDialog
                    trigger={
                      <Button disabled={!canManage}>
                        <Plus className="mr-2 size-4" />
                        New service
                      </Button>
                    }
                  />
                </div>
                <Input
                  type="search"
                  placeholder="Search services"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="h-9 max-w-sm"
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-muted-foreground"
                        >
                          <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                          Loading services...
                        </TableCell>
                      </TableRow>
                    )}
                    {!services.isLoading && services.error && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-8 text-center text-destructive"
                        >
                          {services.error.message}
                        </TableCell>
                      </TableRow>
                    )}
                    {!services.isLoading &&
                      !services.error &&
                      servicesItems.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-10 text-center text-muted-foreground"
                          >
                            {serviceSearch
                              ? "No services match your search."
                              : "No services found."}
                          </TableCell>
                        </TableRow>
                      )}
                    {servicesItems.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>{s.category}</TableCell>
                        <TableCell>{s.vatExempt ? "Exempt" : "VAT"}</TableCell>
                        <TableCell>
                          {s.isActive ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell className="text-right">
                          <ServiceDialog
                            initial={s}
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
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Products</CardTitle>
                  <ProductDialog
                    trigger={
                      <Button disabled={!canManage}>
                        <Plus className="mr-2 size-4" />
                        New product
                      </Button>
                    }
                  />
                </div>
                <Input
                  type="search"
                  placeholder="Search products"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="h-9 max-w-sm"
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>VAT</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                          Loading products...
                        </TableCell>
                      </TableRow>
                    )}
                    {!products.isLoading && products.error && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="py-8 text-center text-destructive"
                        >
                          {products.error.message}
                        </TableCell>
                      </TableRow>
                    )}
                    {!products.isLoading &&
                      !products.error &&
                      productsItems.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            {productSearch
                              ? "No products match your search."
                              : "No products found."}
                          </TableCell>
                        </TableRow>
                      )}
                    {productsItems.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category}</TableCell>
                        <TableCell>{p.sku ?? "—"}</TableCell>
                        <TableCell>{p.vatExempt ? "Exempt" : "VAT"}</TableCell>
                        <TableCell>
                          {p.isActive ? "Active" : "Inactive"}
                        </TableCell>
                        <TableCell className="text-right">
                          <ProductDialog
                            initial={p}
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
          </TabsContent>

          <TabsContent value="billable" className="mt-4">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">Billable items</CardTitle>
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
                <Input
                  type="search"
                  placeholder="Search billable items"
                  value={billableSearch}
                  onChange={(e) => setBillableSearch(e.target.value)}
                  className="h-9 max-w-sm"
                />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billable.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-muted-foreground"
                        >
                          <Loader2 className="mx-auto mb-2 size-4 animate-spin" />
                          Loading billable items...
                        </TableCell>
                      </TableRow>
                    )}
                    {!billable.isLoading && billable.error && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-8 text-center text-destructive"
                        >
                          {billable.error.message}
                        </TableCell>
                      </TableRow>
                    )}
                    {!billable.isLoading &&
                      !billable.error &&
                      billableItems.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="py-10 text-center text-muted-foreground"
                          >
                            {billableSearch
                              ? "No items match your search."
                              : "No billable items found."}
                          </TableCell>
                        </TableRow>
                      )}
                    {billableItems.map((bi: any) => (
                      <TableRow key={bi.id}>
                        <TableCell className="font-medium">{bi.name}</TableCell>
                        <TableCell>{bi.type}</TableCell>
                        <TableCell>
                          {bi.isActive ? "Active" : "Inactive"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RouteGuard>
  );
}
