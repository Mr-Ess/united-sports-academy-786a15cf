/**
 * QA override: disabled access restrictions to unblock the local app while the live DB/auth setup is incomplete.
 * Re-enable to secure the app again before production use.
 */
export const OPEN_ACCESS = true;

export const OPEN_ACCESS_ROLES = ["admin", "editor", "moderator"] as const;
