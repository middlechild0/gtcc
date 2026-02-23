"use client";

import { createClient } from "@visyx/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function useVerifyOtp(nextPath?: string) {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function verify(email: string, token: string) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: token.trim(),
        type: "email",
      });

      if (error) throw error;

      toast.success("Signed in.");
      window.location.assign(nextPath ?? "/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid or expired code.";
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function resend(email: string) {
    setResendLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success("New code sent. Check your email.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setResendLoading(false);
    }
  }

  return { verify, loading, resend, resendLoading };
}
