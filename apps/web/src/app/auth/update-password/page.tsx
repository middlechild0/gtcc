"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@visyx/supabase/client";
import { AuthLayout } from "../components/auth-layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@visyx/ui/form";
import { Input } from "@visyx/ui/input";
import { Button } from "@visyx/ui/button";
import { SubmitButton } from "@visyx/ui/submit-button";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type FormValues = { password: string; confirmPassword: string };

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorFromCallback = searchParams.get("error");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    if (values.password !== values.confirmPassword) {
      form.setError("confirmPassword", { message: "Passwords do not match." });
      return;
    }
    if (values.password.length < 6) {
      form.setError("password", { message: "Use at least 6 characters." });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      toast.success("Password updated.");
      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (errorFromCallback) {
    return (
      <AuthLayout
        title="Invalid or expired link"
        subtitle={decodeURIComponent(errorFromCallback)}
        footer={
          <Link href="/auth/forgot-password" className="underline-offset-4 hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <Button asChild className="h-11 w-full rounded-lg font-medium" variant="default">
          <Link href="/auth/forgot-password">Request new link</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a new password for your account."
      footer={
        <Link href="/auth/sign-in" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            rules={{
              required: "Password is required.",
              minLength: { value: 6, message: "Use at least 6 characters." },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  New password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="h-11 rounded-lg border-border/80"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            rules={{ required: "Confirm your password." }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-muted-foreground">
                  Confirm password
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
            isSubmitting={submitting}
            className="h-11 w-full rounded-lg font-medium"
          >
            Update password
          </SubmitButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
