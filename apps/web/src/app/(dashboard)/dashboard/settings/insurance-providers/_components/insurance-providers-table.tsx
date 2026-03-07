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
    email: string | null;
    phone: string | null;
    address: string | null;
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!providers || providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-48 text-center">
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
