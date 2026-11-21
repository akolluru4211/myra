export const EDMAIL_DOMAIN = "edworld.co.in";
export const EDMAIL_WEBMAIL_HOST = "mails.edworld.co.in";
export const EDMAIL_DEFAULT_QUOTA_BYTES = 512 * 1024 * 1024; // 512 MB
export const EDMAIL_DAILY_SEND_LIMIT = 100;
export const EDMAIL_MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB per file
export const EDMAIL_MAX_RECIPIENTS = 25;

// System reserved addresses that cannot be claimed by students
export const RESERVED_EDMAIL_HANDLES = new Set([
  "admin",
  "administrator",
  "postmaster",
  "hostmaster",
  "webmaster",
  "support",
  "help",
  "info",
  "contact",
  "billing",
  "security",
  "abuse",
  "root",
  "system",
  "noreply",
  "no-reply",
  "notifications",
  "edworld",
  "myra",
  "edmail",
  "compliance",
  "legal",
  "privacy",
  "career",
  "admissions",
  "feedback",
  "grievance",
  "verify",
  "verification",
  "certificate",
  "certificates",
  "scholarship",
  "discount",
  "offers",
  "ambassador",
  "moderator",
]);
