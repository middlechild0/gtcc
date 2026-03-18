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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useHasPermission } from "@/app/auth/components/permission-gate";
import { RouteGuard } from "@/app/auth/components/route-guard";
import { DashboardHeader } from "../../_components/dashboard-header";
import { ProductDialog } from "../_components/product-dialog";
import { ServiceDialog } from "../_components/service-dialog";
import {
  useBillableItems,
  useProducts,
  useServices,
} from "../_hooks/use-catalog";

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
