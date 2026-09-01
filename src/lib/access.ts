/**
 * Temporary testing override: allow direct admin access so the system can be tested end-to-end
 * with real data and live flows before final production hardening.
 */
export const OPEN_ACCESS = true;

export const OPEN_ACCESS_ROLES = ["admin", "editor", "moderator"] as const;
