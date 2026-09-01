/**
 * Production guard: keep auth and role enforcement enabled unless an explicit QA override is required.
 * This app must not silently bypass authentication in the live environment.
 */
export const OPEN_ACCESS = false;

export const OPEN_ACCESS_ROLES = ["admin", "editor", "moderator"] as const;
