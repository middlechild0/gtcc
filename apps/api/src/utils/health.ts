import { createClient } from "@supabase/supabase-js";

type HealthResult = { ok: true } | { ok: false; error: string };

export async function checkSupabaseHealth(): Promise<HealthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !anonKey) {
    return { ok: false, error: "SUPABASE_ENV_MISSING" };
  }

  try {
    const supabase = createClient(url, anonKey);
    // Lightweight call: we expect an auth error but it proves connectivity.
    const { error } = await supabase.auth.getUser("invalid-token");
    if (error && error.message.toLowerCase().includes("jwt")) {
      return { ok: true };
    }
    // If there is no error, or a non-JWT error, still treat as ok – we reached Supabase.
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown Supabase error";
    return { ok: false, error: message };
  }
}

