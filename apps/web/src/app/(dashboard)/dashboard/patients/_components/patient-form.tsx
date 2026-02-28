"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { SubmitButton } from "@visyx/ui/submit-button";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

type PatientFormProps = {
  defaultValues: PatientFormValues;
  onSubmit: (values: PatientFormValues) => Promise<void> | void;
  submitting?: boolean;
  cancelHref: string;
};

export function PatientForm({
  defaultValues,
  onSubmit,
  submitting,
  cancelHref,
}: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues,
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-0">
        <CardHeader>
          <CardTitle className="text-base">Patient details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                placeholder="Jane"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.firstName.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName ? (
                <p className="text-destructive text-xs">
                  {form.formState.errors.lastName.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="patient@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+254700000000"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-destructive text-xs">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-2">
          <Button type="button" variant="outline" asChild disabled={submitting}>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
          <SubmitButton type="submit" isSubmitting={Boolean(submitting)}>
            Register patient
          </SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}
