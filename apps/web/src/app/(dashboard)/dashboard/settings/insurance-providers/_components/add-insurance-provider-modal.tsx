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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useInsuranceProviders } from "../_hooks/use-insurance-providers";
import type { AddInsuranceProviderModalProps } from "./types";

const CreateInsuranceProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
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
      name: providerToEdit?.name || "",
      email: providerToEdit?.email || "",
      phone: providerToEdit?.phone || "",
      address: providerToEdit?.address || "",
    },
  });

  const onSubmit = async (data: CreateInsuranceProviderInput) => {
    try {
      if (isEditing && providerToEdit) {
        await update.mutateAsync({ id: providerToEdit.id, ...data });
      } else {
        await create.mutateAsync(data);
      }
      form.reset();
      onOpenChange(false);
    } catch (_error) {
      // Error is handled by the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Insurance Provider" : "Add Insurance Provider"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update insurance company details."
              : "Register a new insurance company in the system."}
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
                    <Input placeholder="NHIF, Jubilee, APA..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="contact@provider.com"
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+254 700 000000"
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
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Address / P.O BOX</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Upperhill, Nairobi"
                      {...field}
                      value={field.value ?? ""}
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
      </DialogContent>
    </Dialog>
  );
}
