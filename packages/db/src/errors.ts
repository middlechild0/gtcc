export class ReportNotFoundError extends Error {
  code = "USER_PROFILE_NOT_FOUND" as const;

  constructor() {
    super("User profile not found");
    this.name = "UserProfileNotFoundError";
  }
}