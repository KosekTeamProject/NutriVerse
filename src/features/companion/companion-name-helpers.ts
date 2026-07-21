// Companion display-name helpers — server-safe.

export const DEFAULT_COMPANION_NAME = "Nora";
export const COMPANION_NAME_STORAGE_KEY = "nv-companion-name-v1";
export const MIN_COMPANION_NAME_LENGTH = 2;
export const MAX_COMPANION_NAME_LENGTH = 24;

// Sanitize user-provided companion display name.
// Min 2 chars, max 24 chars, trims whitespace, collapses spaces, strips HTML & control chars.
// Prevents duplicate suffixes like "Dimas Companion Companion".
// Default fallback is "Nora".
export function sanitizeCompanionDisplayName(raw: string): string {
  if (typeof raw !== "string") return DEFAULT_COMPANION_NAME;

  let s = raw.trim();
  s = s.replace(/[ \t]{2,}/g, " ");
  s = s.replace(/<[^>]*>/g, "");
  s = s.replace(/[\x00-\x1f\x7f]/g, "");

  // Strip trailing "Companion" if user typed it into input, to prevent "Dimas Companion Companion"
  if (s.toLowerCase().endsWith(" companion")) {
    s = s.slice(0, -9).trim();
  }

  if (s.length < MIN_COMPANION_NAME_LENGTH) return DEFAULT_COMPANION_NAME;
  return s.slice(0, MAX_COMPANION_NAME_LENGTH);
}

// Server-safe helper to get default display name
export function getCompanionDisplayName(): string {
  return DEFAULT_COMPANION_NAME;
}

// Helper to format Companion titles cleanly without duplicating names (e.g. avoid "Nora Nora")
export function formatCompanionTitle(name: string, suffix = "Companion"): string {
  const cleanName = sanitizeCompanionDisplayName(name);
  return `${cleanName} ${suffix}`.trim();
}

// Format Companion labels dynamically for various UI surfaces
export function formatCompanionLabel(
  name: string,
  type: "eyebrow" | "title" | "chat" | "typing" | "scanner" | "guidance" | "reflection" | "interpretation" | "weekly"
): string {
  const cleanName = sanitizeCompanionDisplayName(name);
  switch (type) {
    case "eyebrow":
      return `${cleanName.toUpperCase()} COMPANION`;
    case "title":
      return `${cleanName} Companion`;
    case "chat":
      return `Percakapan dengan ${cleanName}`;
    case "typing":
      return `${cleanName} sedang mengetik`;
    case "scanner":
      return `Tanyakan hasil ini kepada ${cleanName}`;
    case "guidance":
      return `Panduan dari ${cleanName}`;
    case "reflection":
      return `Refleksi dari ${cleanName}`;
    case "interpretation":
      return `Interpretasi dari ${cleanName}`;
    case "weekly":
      return `Refleksi Mingguan ${cleanName}`;
  }
}

