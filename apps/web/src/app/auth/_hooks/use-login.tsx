import { createClient } from "@visyx/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export type LoginMode = "passwordless" | "password";

export function useLogin(nextPath?: string) {
  const [mode, setMode] = useState<LoginMode>("passwordless");
  const [loading, setLoading] = useState(false);

  async function continueWithEmail(email: string) {
    setLoading(true);
    try {
      const supabase = createClient();
      // Omit emailRedirectTo so Supabase sends a 6-digit OTP (not a magic link).
      // In Supabase Dashboard: Auth → Email Templates → set "Confirm signup" to use {{ .Token }} for the code.
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("We emailed you a 6‑digit code.");
      window.location.assign(
        `/auth/verify-code?email=${encodeURIComponent(email)}`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send login code.");
    } finally {
      setLoading(false);
    }
  }

  async function signInWithPassword(email: string, password: string) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast.success("Signed in.");
      window.location.assign(nextPath ?? "/");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return {
    mode,
    loading,
    setMode,
    continueWithEmail,
    signInWithPassword,
  };
}
