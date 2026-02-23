import { createClient } from "@visyx/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles the redirect from Supabase after magic link / password reset.
 * Exchanges the auth code for a session using the server client (cookies),
 * so the PKCE code verifier is found and the flow works.
 *
 * Add this URL to Supabase Dashboard → Auth → URL Configuration → Redirect URLs:
 * - http://localhost:3000/auth/callback (and your production origin + /auth/callback)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth/sign-in";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=Invalid code", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(
      new URL(`/auth/sign-in?error=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
