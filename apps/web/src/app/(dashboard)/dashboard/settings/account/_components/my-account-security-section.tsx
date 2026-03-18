"use client";

import { createClient } from "@visyx/supabase/client";
import { Button } from "@visyx/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@visyx/ui/card";
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
import { toast } from "sonner";
import { useResetPassword } from "@/app/auth/_hooks/use-reset-password";

type FormValues = { newPassword: string; confirmPassword: string };

type MyAccountSecuritySectionProps = {
  email: string | null;
};

export function MyAccountSecuritySection({
  email,
}: MyAccountSecuritySectionProps) {
  const form = useForm<FormValues>({
    defaultValues: { newPassword: "", confirmPassword: "" },
  });
  const { loading: sendingReset, sendReset } = useResetPassword();

  async function onSubmit(values: FormValues) {
    if (values.newPassword !== values.confirmPassword) {
      form.setError("confirmPassword", { message: "Passwords do not match." });
      return;
    }
    if (values.newPassword.length < 6) {
      form.setError("newPassword", { message: "Use at least 6 characters." });
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      if (error) throw error;
      toast.success("Password updated.");
      form.reset();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    }
  }

  const canSendReset = Boolean(email) && !sendingReset;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password directly or send yourself a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4 sm:grid-cols-2"
            >
              <FormField
                control={form.control}
                name="newPassword"
                rules={{
                  required: "Password is required.",
                  minLength: {
                    value: 6,
                    message: "Use at least 6 characters.",
                  },
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
                        className="h-9 rounded-lg border-border/80"
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
                        className="h-9 rounded-lg border-border/80"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  className="h-9 rounded-lg"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Updating..."
                    : "Update password"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="space-y-2">
            <p className="text-sm font-medium">Password reset link</p>
            <p className="text-muted-foreground text-xs">
              We&apos;ll email a secure link to{" "}
              <span className="font-medium">
                {email ?? "your account email"}
              </span>{" "}
              so you can reset your password.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-1 h-9 rounded-lg"
              disabled={!canSendReset}
              onClick={() => {
                if (!email) return;
                void sendReset(email);
              }}
            >
              {sendingReset ? "Sending..." : "Send reset link"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
