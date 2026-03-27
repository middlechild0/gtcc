import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@visyx/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@visyx/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visyx/ui/form";
import { Input } from "@visyx/ui/input";
import { Textarea } from "@visyx/ui/textarea";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useInsuranceProviders } from "../_hooks/use-insurance-providers";
import type { AddInsuranceProviderModalProps } from "./types";

const BillingBasisSchema = z.enum(["CAPITATION", "FEE_FOR_SERVICE"]);

const CreateInsuranceProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  providerCode: z.string().optional(),
  billingBasis: BillingBasisSchema.default("FEE_FOR_SERVICE"),
  requiresPreAuth: z.boolean().default(false),
  copayAmount: z.coerce.number().int().min(0).default(0),
  shaAccreditationNumber: z.string().optional(),
  schemesText: z.string().default(""),
});

export type CreateInsuranceProviderInput = z.infer<
  typeof CreateInsuranceProviderSchema
>;

export function AddInsuranceProviderModal({
  open,
  onOpenChange,
  providerToEdit,
}: AddInsuranceProviderModalProps) {
  const { create, update } = useInsuranceProviders();
  const isEditing = !!providerToEdit;

  const form = useForm<CreateInsuranceProviderInput>({
    resolver: zodResolver(CreateInsuranceProviderSchema),
    defaultValues: {
      name: "",
      providerCode: "",
      billingBasis: "FEE_FOR_SERVICE",
      requiresPreAuth: false,
      copayAmount: 0,
      shaAccreditationNumber: "",
      schemesText: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    form.reset({
      name: providerToEdit?.name || "",
      providerCode: providerToEdit?.providerCode || "",
      billingBasis: providerToEdit?.billingBasis || "FEE_FOR_SERVICE",
      requiresPreAuth: providerToEdit?.requiresPreAuth ?? false,
      copayAmount: providerToEdit?.copayAmount ?? 0,
      shaAccreditationNumber: providerToEdit?.shaAccreditationNumber || "",
      schemesText:
        providerToEdit?.schemes?.map((scheme) => scheme.name).join("\n") || "",
    });
  }, [open, providerToEdit, form]);

  const onSubmit = async (data: CreateInsuranceProviderInput) => {
    const schemes = data.schemesText
      .split(/\r?\n/)
      .map((v) => v.trim())
      .filter(Boolean)
      .map((name) => ({
        name,
        billingBasis: data.billingBasis,
        requiresPreAuth: data.requiresPreAuth,
        copayAmount: data.copayAmount,
      }));

    try {
      if (isEditing && providerToEdit) {
        await update.mutateAsync({
          id: providerToEdit.id,
          name: data.name,
          providerCode: data.providerCode || null,
          billingBasis: data.billingBasis,
          requiresPreAuth: data.requiresPreAuth,
          copayAmount: data.copayAmount,
          shaAccreditationNumber: data.shaAccreditationNumber || null,
          schemes,
        });
      } else {
        await create.mutateAsync({
          name: data.name,
          providerCode: data.providerCode || null,
          billingBasis: data.billingBasis,
          requiresPreAuth: data.requiresPreAuth,
          copayAmount: data.copayAmount,
          shaAccreditationNumber: data.shaAccreditationNumber || null,
          schemes,
        });
      }
      form.reset();
      onOpenChange(false);
    } catch (_error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <div className="space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Insurance Provider" : "Add Insurance Provider"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update SHA/insurance billing setup."
                : "Register a new SHA/insurance payer for claims billing."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="SHA, Jubilee, APA..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payer / Provider Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. SHA facility code"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingBasis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Basis</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        {...field}
                      >
                        <option value="FEE_FOR_SERVICE">Fee for service</option>
                        <option value="CAPITATION">Capitation</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="copayAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Co-pay Amount (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shaAccreditationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SHA Accreditation Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter SHA accreditation number"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresPreAuth"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel>Requires Pre-authorization</FormLabel>
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={Boolean(field.value)}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schemesText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheme Names (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={"Civil Servants\nSHA Standard\nLinda Mama"}
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? isEditing
                      ? "Saving..."
                      : "Adding..."
                    : isEditing
                      ? "Save Changes"
                      : "Add Provider"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
