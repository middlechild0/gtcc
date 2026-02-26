"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
import { Input } from "@visyx/ui/input";
import { Label } from "@visyx/ui/label";
import Link from "next/link";
import { SubmitButton } from "@visyx/ui/submit-button";

const branchFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;

type BranchFormProps = {
  mode: "create" | "edit";
  defaultValues: BranchFormValues;
  readOnly?: boolean;
  onSubmit: (values: BranchFormValues) => Promise<void> | void;
  submitting?: boolean;
  cancelHref: string;
};

export function BranchForm({
  mode,
  defaultValues,
  readOnly,
  onSubmit,
  submitting,
  cancelHref,
}: BranchFormProps) {
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-0">
        <CardHeader>
          <CardTitle className="text-base">
            {mode === "create" ? "Branch details" : "Edit branch details"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Branch name"
              readOnly={readOnly}
              {...form.register("name")}
            />
            {form.formState.errors.name ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Street, city"
              readOnly={readOnly}
              {...form.register("address")}
            />
            {form.formState.errors.address ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.address.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+254700000000"
                readOnly={readOnly}
                {...form.register("phone")}
              />
              {form.formState.errors.phone ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.phone.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="branch@example.com"
                readOnly={readOnly}
                {...form.register("email")}
              />
              {form.formState.errors.email ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          {!readOnly && (
            <SubmitButton type="submit" isSubmitting={Boolean(submitting)}>
              {mode === "create" ? "Save branch" : "Save changes"}
            </SubmitButton>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

