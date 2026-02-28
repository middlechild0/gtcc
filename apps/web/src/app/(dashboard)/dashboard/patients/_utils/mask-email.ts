/**
 * Masks an email for display: "user@domain.com" → "u***r@domain.com".
 * Returns "—" for empty/null.
 */
export function maskEmail(email: string | null | undefined): string {
  if (email == null || email.trim() === "") return "—";
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0]}***${domain}`;
  return `${local[0]}***${local[local.length - 1]}${domain}`;
}
