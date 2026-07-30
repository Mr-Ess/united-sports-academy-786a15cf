/**
 * وضع الوصول المفتوح (مؤقت للتطوير).
 * لما يكون true: أي حد يقدر يفتح لوحة التحكم من غير تسجيل دخول أو صلاحيات.
 * رجّعه false عشان ترجّع نظام الأدوار الطبيعي.
 */
export const OPEN_ACCESS = true;

export const OPEN_ACCESS_ROLES = ["admin", "editor", "moderator"] as const;
