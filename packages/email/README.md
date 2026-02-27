# @visyx/email

Email templates built with [React Email](https://react.email).

## Templates

- **invite** – User / staff invitation

## Usage

```ts
import { InviteEmail } from "@visyx/email/emails/invite";
import { render } from "@visyx/email/render";
import { sendEmail } from "@visyx/email";

// Render invite email to HTML
const inviteHtml = await render(
  <InviteEmail
    invitedByName="Jane"
    teamName="Acme Co"
    email="user@example.com"
    inviteLink="https://app.visyx.co.ke/invite/abc123"
  />
);

// Send via Resend
await sendEmail({
  to: "user@example.com",
  subject: "You’re invited to join Acme Co on Visyx",
  html: inviteHtml,
});
```

## Adding a template

1. Create `emails/your-template.tsx`
2. Use `EmailThemeProvider`, `Logo`, `Footer` from `components/`
3. Export the component and add to this README

## Environment

The email package uses Resend under the hood:

- **`RESEND_API_KEY`** – API key for Resend (required to send emails)
- **`CONTACT_EMAIL_FROM`** – Default `from` address for emails (e.g. `Visyx <no-reply@visyx.co.ke>`)
- **`DASHBOARD_URL`** (optional) – Overrides the default dashboard URL used by `getAppUrl` in `@visyx/utils/envs`

## Dev preview

```bash
bun run dev
```

Opens the React Email preview server at http://localhost:3002.
