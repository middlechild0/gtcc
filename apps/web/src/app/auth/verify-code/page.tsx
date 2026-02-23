"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { InputOTP } from "@visyx/ui/input-otp";
import { AuthLayout } from "../components/auth-layout";
import { useVerifyOtp } from "../_hooks/use-verify-otp";
import { Button } from "@visyx/ui/button";
import { cn } from "@visyx/ui/cn";

export default function VerifyCodePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const { verify, loading } = useVerifyOtp();

  const isValid = code.length === 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !isValid) return;
    await verify(email, code);
  }

  if (!email) {
    return (
      <AuthLayout
        title="Missing email"
        subtitle="Please start sign-in again from the beginning."
        footer={
          <Link href="/auth/sign-in" className="text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        }
      >
        <Button asChild variant="outline" className="w-full rounded-lg">
          <Link href="/auth/sign-in">Go to sign in</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>. Enter it below.
        </>
      }
      footer={
        <Link href="/auth/sign-in" className="text-muted-foreground underline-offset-4 hover:underline text-sm">
          Use a different method
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => setCode(v)}
            containerClassName="w-full justify-center gap-1"
            render={({ slots }) => (
              <div className="flex w-full justify-center gap-1">
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className={cn(
                      "relative flex h-12 w-12 flex-1 max-w-[3rem] items-center justify-center rounded-lg border border-input bg-background text-center text-xl font-semibold tabular-nums text-foreground transition-colors",
                      slot.isActive && "z-10 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                    )}
                  >
                    {slot.char ?? (slot.hasFakeCaret ? (
                      <span className="animate-caret-blink inline-block h-5 w-0.5 bg-foreground" />
                    ) : null)}
                  </div>
                ))}
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground">Enter the 6-digit code from your email</p>
        </div>

        <Button
          type="submit"
          disabled={!isValid || loading}
          className={cn("w-full rounded-lg h-11 font-medium")}
        >
          {loading ? "Verifying…" : "Verify and sign in"}
        </Button>
      </form>
    </AuthLayout>
  );
}
