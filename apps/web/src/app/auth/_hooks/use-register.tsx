import { createClient } from "@visyx/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

type CreateAccountArgs = {
  fullName: string;
  email: string;
  password: string;
};

export function useRegister() {
  const [loading, setLoading] = useState(false);

  async function createAccount({
    fullName,
    email,
    password,
  }: CreateAccountArgs) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Account created. Check your email to verify.");
      window.location.assign(
        `/auth/verify-email?email=${encodeURIComponent(email)}`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  function signUpWithGoogle() {
    const supabase = createClient();
    void supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      .catch((err) => {
        toast.error(err?.message ?? "Failed to start Google sign up.");
      });
  }

  function signUpWithDiscord() {
    const supabase = createClient();
    void supabase.auth
      .signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      .catch((err) => {
        toast.error(err?.message ?? "Failed to start Discord sign up.");
      });
  }

  function signUpWithFacebook() {
    const supabase = createClient();
    void supabase.auth
      .signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      .catch((err) => {
        toast.error(err?.message ?? "Failed to start Facebook sign up.");
      });
  }

  return {
    loading,
    createAccount,
    signUpWithGoogle,
    signUpWithDiscord,
    signUpWithFacebook,
  };
}
