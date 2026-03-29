"use client";

import { Button } from "@visyx/ui/button";
import { Spinner } from "@visyx/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@visyx/ui/table";
import { Plus, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useInsuranceProviders } from "../_hooks/use-insurance-providers";
import { AddInsuranceProviderModal } from "./add-insurance-provider-modal";

export function InsuranceProvidersTable() {
  const { providers, isLoading } = useInsuranceProviders();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<{
    id: number;
    name: string;
    providerCode: string | null;
    billingBasis: "CAPITATION" | "FEE_FOR_SERVICE";
    requiresPreAuth: boolean;
    copayAmount: number;
    shaAccreditationNumber: string | null;
    schemes: {
      id: number;
      name: string;
      billingBasis: "CAPITATION" | "FEE_FOR_SERVICE";
      requiresPreAuth: boolean;
      copayAmount: number;
      isActive: boolean;
    }[];
  } | null>(null);

  const handleEdit = (provider: any) => {
    setProviderToEdit(provider);
    setIsAddModalOpen(true);
  };

  const handleOpenChange = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) {
      setProviderToEdit(null); // Reset when closing
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Providers list</h2>
        <Button onClick={() => handleOpenChange(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add provider
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Provider Code</TableHead>
              <TableHead>Billing Basis</TableHead>
              <TableHead>Co-pay</TableHead>
              <TableHead>Pre-auth</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!providers || providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <ShieldAlert className="h-10 w-10 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No providers found</h3>
                    <p className="text-sm text-muted-foreground">
                      You have not added any insurance providers yet.
                    </p>
                    <Button
                      onClick={() => handleOpenChange(true)}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add first provider
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell>{provider.providerCode || "—"}</TableCell>
                  <TableCell>
                    {provider.billingBasis === "CAPITATION"
                      ? "Capitation"
                      : "Fee for service"}
                  </TableCell>
                  <TableCell>KES {provider.copayAmount ?? 0}</TableCell>
                  <TableCell>
                    {provider.requiresPreAuth ? "Required" : "Not required"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(provider)}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddInsuranceProviderModal
        open={isAddModalOpen}
        onOpenChange={handleOpenChange}
        providerToEdit={providerToEdit}
      />
    </div>
  );
}
