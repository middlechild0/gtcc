"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "../components/auth-layout";
import { useAuthForm } from "../hooks/use-auth-form";
import { requestPasswordReset } from "../services/auth";
import { getFriendlyErrorMessage } from "../utils/error";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@visyx/ui/form";
import { Input } from "@visyx/ui/input";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Alert, AlertDescription } from "@visyx/ui/alert";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { form, handleSubmit, isSubmitting } = useAuthForm({
    onSubmit: async (values) => {
      setError(null);
      try {
        await requestPasswordReset(values.email);
        toast.success("Password reset link sent to your email.");
        router.push("/auth/sign-in");
      } catch (err) {
        const message = getFriendlyErrorMessage(err);
        setError(message);
        toast.error(message);
      }
    },
  });

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email linked to your Batian Optical account. We’ll send you a secure reset link."
      footer={
        <Link href="/auth/sign-in" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Form {...form}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <FormField
            control={form.control}
            name="email"
            rules={{ required: "Email is required." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@batian-optical.co.ke"
                    autoComplete="email"
                    className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error ? (
            <Alert variant="destructive" className="rounded-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <SubmitButton
            type="submit"
            isSubmitting={isSubmitting}
            className="w-full rounded-md"
          >
            Email reset link
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}

