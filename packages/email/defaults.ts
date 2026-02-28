/**
 * Shared default email copy for invoice emails.
 *
 * These are the canonical fallback strings used when the user hasn't
 * customized the email content in their invoice template. Both the
 * dashboard email-preview component and the actual email template
 * import from here so the two can never drift out of sync.
 */

export function defaultEmailSubject(message: string) {
  return `${message} `;
}

export function defaultEmailHeading(message: string) {
  return `Message from ${message}`;
}

export function defaultEmailBody(message: string) {
  return `If you have any questions, just reply to this email.\n\nThanks,\n${message}`;
}

export const DEFAULT_EMAIL_BUTTON_TEXT = "Visit Website";
