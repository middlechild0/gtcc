"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@visyx/ui/input-otp";
import { AuthLayout } from "../components/auth-layout";
import { useVerifyOtp } from "../_hooks/use-verify-otp";
import { Button } from "@visyx/ui/button";
import { SubmitButton } from "@visyx/ui/submit-button";
import { Loader } from "@visyx/ui/loader";
import { cn } from "@visyx/ui/cn";

function VerifyCodeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const { verify, loading, resend, resendLoading } = useVerifyOtp();

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
          Use a different email
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-3">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={(v) => setCode(v)}
            containerClassName="w-full justify-center gap-1.5"
            render={({ slots }) => (
              <InputOTPGroup className="gap-1.5">
                {slots.map((slot, i) => {
                  const { index: _index, ...slotProps } = slot as typeof slot & { index?: number };
                  return (
                    <InputOTPSlot
                      key={i}
                      {...slotProps}
                      className={cn(
                        "h-12 w-12 rounded-lg border border-input bg-background text-center text-xl font-semibold tabular-nums text-foreground",
                        slotProps.isActive && "z-10 border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background",
                      )}
                    />
                  );
                })}
              </InputOTPGroup>
            )}
          />
          <p className="text-xs text-muted-foreground">Enter the 6-digit code from your email</p>
        </div>

        <div className="flex flex-col gap-2">
          <SubmitButton
            type="submit"
            isSubmitting={loading}
            disabled={!isValid}
            className="w-full rounded-lg h-11 font-medium"
          >
            Verify and sign in
          </SubmitButton>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            disabled={resendLoading}
            onClick={() => resend(email)}
          >
            {resendLoading ? "Sending…" : "Resend code"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Check your email" subtitle="Loading…">
          <div className="flex justify-center py-8">
            <Loader />
          </div>
        </AuthLayout>
      }
    >
      <VerifyCodeContent />
    </Suspense>
  );
}
