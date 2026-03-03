import * as React from "react";
import { InviteEmail } from "../emails/invite";
import { render } from "../render";

type HealthResult = { ok: true } | { ok: false; error: string };

export async function checkEmailHealth(): Promise<HealthResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: "EMAIL_ENV_MISSING" };
  }

  try {
    // Render a simple email to validate React/JSX and template wiring.
    await render(
      React.createElement(InviteEmail, {
        invitedByName: "HealthCheck",
        appName: "Visyx",
        email: "healthcheck@example.com",
        inviteLink: "https://example.com",
      }),
    );
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown email error";
    return { ok: false, error: message };
  }
}

