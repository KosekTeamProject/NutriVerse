export const ADMIN_STORAGE_KEY = "nutriverse.admin-session";
export const ADMIN_EVENT = "nutriverse:admin-session-updated";

export type AdminRole = "Super Admin" | "Moderator" | "Event Manager" | "Reward Manager" | "Analyst";

export type AdminSession = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: AdminRole;
  readonly signedInAt: string;
};

const DEMO_ADMIN_ACCOUNTS = [
  { id: "adm-001", name: "Dimas Rofiq", email: "admin@nutriverse.id", password: "admin123", role: "Super Admin" as const },
  { id: "adm-002", name: "Faishal Moderator", email: "moderator@nutriverse.id", password: "mod12345", role: "Moderator" as const },
];

export function authenticateDemoAdmin(email: string, password: string): AdminSession | null {
  const account = DEMO_ADMIN_ACCOUNTS.find((item) => item.email === email.trim().toLowerCase() && item.password === password);
  if (!account) return null;
  return { id: account.id, name: account.name, email: account.email, role: account.role, signedInAt: new Date().toISOString() };
}

export function saveAdminSession(session: AdminSession) {
  window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(ADMIN_EVENT));
}

export function clearAdminSession() {
  window.localStorage.removeItem(ADMIN_STORAGE_KEY);
  window.dispatchEvent(new Event(ADMIN_EVENT));
}
