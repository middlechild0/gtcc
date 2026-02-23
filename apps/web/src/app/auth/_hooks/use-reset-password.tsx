import { createClient } from "@visyx/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export function useResetPassword() {
  const [loading, setLoading] = useState(false);

  async function sendReset(email: string) {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      toast.success("If this account exists, a reset link is on the way.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to start password reset.");
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    sendReset,
  };
}
