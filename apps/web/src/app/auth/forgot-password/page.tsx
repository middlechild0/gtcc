"use client";

import Link from "next/link";
import { AuthLayout } from "../components/auth-layout";
import { useResetPassword } from "../_hooks/use-reset-password";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visyx/ui/form";
import { Input } from "@visyx/ui/input";
import { SubmitButton } from "@visyx/ui/submit-button";

type FormValues = { email: string };

export default function ForgotPasswordPage() {
  const { loading, sendReset } = useResetPassword();
  const form = useForm<FormValues>({
    defaultValues: { email: "" },
  });

  function onSubmit(values: FormValues) {
    sendReset(values.email);
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email linked to your account. We'll send you a secure reset link."
      footer={
        <Link href="/auth/sign-in" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Work email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@batian-optical.co.ke"
                    autoComplete="email"
                    className="h-11 rounded-lg border-border/80"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <SubmitButton
            type="submit"
            isSubmitting={loading}
            className="h-11 w-full rounded-lg font-medium"
          >
            Email reset link
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
