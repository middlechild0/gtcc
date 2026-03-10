"use client";

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
import { useStaffDetail } from "../_hooks/use-staff-detail";
import { useStaffSecurity } from "../_hooks/use-staff-security";

type PasswordFormValues = {
  newPassword: string;
  confirmPassword: string;
};

export function StaffSecurityTab() {
  const { id: staffId, staff } = useStaffDetail();
  const { changePassword, sendPasswordReset, isReady } =
    useStaffSecurity(staffId);

  const form = useForm<PasswordFormValues>({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PasswordFormValues) {
    if (!isReady) return;

    if (values.newPassword !== values.confirmPassword) {
      form.setError("confirmPassword", {
        message: "Passwords do not match.",
      });
      return;
    }

    if (values.newPassword.length < 6) {
      form.setError("newPassword", {
        message: "Use at least 6 characters.",
      });
      return;
    }

    try {
      await changePassword.mutateAsync({
        staffId: staffId!,
        newPassword: values.newPassword,
      });
      toast.success("Password updated for this user.");
      form.reset();
    } catch (err: any) {
      toast.error(
        err?.message ?? "Failed to update this user's password.",
      );
    }
  }

  const canSendReset = Boolean(staff?.email) && isReady;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change the user&apos;s password directly or send them a reset link.
            These actions are recorded in the audit log.
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
                rules={{ required: "Confirm the password." }}
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
                  disabled={
                    !isReady || changePassword.isPending
                  }
                >
                  {changePassword.isPending
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
                {staff?.email ?? "the user&apos;s account email"}
              </span>{" "}
              so they can reset their password.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-1 h-9 rounded-lg"
              disabled={!canSendReset || sendPasswordReset.isPending}
              onClick={async () => {
                if (!isReady) return;
                try {
                  await sendPasswordReset.mutateAsync({
                    staffId: staffId!,
                  });
                  toast.success(
                    "If this account exists, a reset link is on the way.",
                  );
                } catch (err: any) {
                  toast.error(
                    err?.message ??
                      "Failed to start password reset for this user.",
                  );
                }
              }}
            >
              {sendPasswordReset.isPending
                ? "Sending..."
                : "Send reset link"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
