"use client";

import { createClient } from "@visyx/supabase/client";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const load = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setLoading(false);
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
