import { createClient } from "@visyx/supabase/server";
import { NextResponse } from "next/server";


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
