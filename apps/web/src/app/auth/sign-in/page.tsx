"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthLayout } from "../components/auth-layout";
import { useAuthForm } from "../hooks/use-auth-form";
import { login } from "../services/auth";
import { getFriendlyErrorMessage } from "../utils/error";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@visyx/ui/form";
import { Input } from "@visyx/ui/input";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Alert, AlertDescription } from "@visyx/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const { form, handleSubmit, isSubmitting } = useAuthForm({
    onSubmit: async (values) => {
      setError(null);
      try {
        const result = await login({
          email: values.email,
          password: values.password ?? "",
        });

        toast.success("Welcome back.");
        router.push(result.redirectTo ?? "/");
      } catch (err) {
        const message = getFriendlyErrorMessage(err);
        setError(message);
        toast.error(message);
      }
    },
  });

  return (
    <AuthLayout
      title="Sign in to Batian Optical"
      subtitle="Secure access to your clinics, lenses, and optical workflows."
      footer={
        <Link
          href="/auth/forgot-password"
          className="underline-offset-4 hover:underline"
        >
          Forgot your password?
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

          <FormField
            control={form.control}
            name="password"
            rules={{
              required: "Password is required.",
              minLength: { value: 8, message: "Password must be at least 8 characters." },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
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
            Sign in
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}

