import { createClient } from "@visyx/supabase/client";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  ok: boolean;
  redirectTo?: string;
};

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
    redirectTo: "/",
  };
}

export async function requestPasswordReset(email: string): Promise<AuthResponse> {
  const supabase = createClient();
  const redirectTo =
    process.env.NEXT_PUBLIC_APP_URL != null
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/sign-in`
      : undefined;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    ok: true,
  };
}

