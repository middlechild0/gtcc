"use client";

import Link from "next/link";
import { AuthLayout } from "../components/auth-layout";
import { useLoginForms } from "../_hooks/use-login-forms";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@visyx/ui/tabs";
import { cn } from "@visyx/ui/cn";

export default function SignInPage() {
  const {
    mode,
    setMode,
    passwordlessForm,
    passwordForm,
    handlePasswordlessSubmit,
    handlePasswordSubmit,
    loading,
  } = useLoginForms();

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Use your work email to continue."
      footer={
        <Link
          href="/auth/forgot-password"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Forgot your password?
        </Link>
      }
    >
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "passwordless" | "password")}
        className="w-full"
      >
        <TabsList className="mb-6 grid w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
          <TabsTrigger value="passwordless" className="rounded-lg">
            Email code
          </TabsTrigger>
          <TabsTrigger value="password" className="rounded-lg">
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="passwordless" className="mt-0">
          <Form {...passwordlessForm}>
            <form
              className="space-y-5"
              onSubmit={passwordlessForm.handleSubmit(handlePasswordlessSubmit)}
            >
              <FormField
                control={passwordlessForm.control}
                name="email"
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
                        className={cn("h-11 rounded-lg border-border/80")}
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
                Send 6-digit code
              </SubmitButton>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="password" className="mt-0">
          <Form {...passwordForm}>
            <form
              className="space-y-5"
              onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            >
              <FormField
                control={passwordForm.control}
                name="email"
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
                        className={cn("h-11 rounded-lg border-border/80")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        className={cn("h-11 rounded-lg border-border/80")}
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
                Sign in
              </SubmitButton>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </AuthLayout>
  );
}
