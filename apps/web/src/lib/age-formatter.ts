import {
  differenceInDays,
  differenceInMonths,
  differenceInYears,
} from "date-fns";

/**
 * Calculates a dynamically formatted age string for a given birth date.
 * - Under 1 month: returns in days ("5 Days")
 * - Under 2 years: returns in months ("14 Months")
 * - 2 years and older: returns in years ("34 Years")
 *
 * @param dateOfBirth ISO string or Date object
 * @returns Formatted age string or "Unknown"
 */
export function formatAge(dateOfBirth?: string | Date | null): string {
  if (!dateOfBirth) return "Unknown";

  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;

  if (Number.isNaN(dob.getTime())) return "Unknown";

  const now = new Date();
  const years = differenceInYears(now, dob);

  if (years >= 2) {
    return `${years} Year${years === 1 ? "" : "s"}`;
  }

  const months = differenceInMonths(now, dob);
  if (months >= 1) {
    return `${months} Month${months === 1 ? "" : "s"}`;
  }

  const days = differenceInDays(now, dob);
  // Prevent negative days if there's a slight timezone/clock difference
  const safeDays = Math.max(0, days);

  return `${safeDays} Day${safeDays === 1 ? "" : "s"}`;
}
