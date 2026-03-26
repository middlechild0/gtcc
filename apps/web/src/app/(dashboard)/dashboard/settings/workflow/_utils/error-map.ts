export function isForbiddenError(error: unknown): boolean {
  const code =
    typeof error === "object" && error !== null && "data" in error
      ? (error as { data?: { code?: string } }).data?.code
      : undefined;
  return code === "FORBIDDEN";
}

export function mapWorkflowError(error: unknown): string {
  const fallback = "Something went wrong. Please try again.";
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  const lower = message.toLowerCase();

  if (lower.includes("department") && lower.includes("already exists")) {
    return "Department code already exists.";
  }

  if (lower.includes("active visits") && lower.includes("deactivate")) {
    return "Cannot deactivate department while active visits are assigned to it.";
  }

  if (lower.includes("used in a visit type workflow")) {
    return "Cannot deactivate department while it is still used in workflow steps.";
  }

  if (lower.includes("visit type") && lower.includes("already exists")) {
    return "Visit type name already exists.";
  }

  if (
    lower.includes("unknown department code") ||
    lower.includes("inactive and cannot be used")
  ) {
    return "One or more selected departments are invalid or inactive.";
  }

  return message || fallback;
}
