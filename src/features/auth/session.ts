export const AUTH_STORAGE_KEY = "nutriverse.auth-session";
export const AUTH_EVENT = "nutriverse:auth-session-updated";

export type HealthBaseline = {
  readonly heightCm: number;
  readonly weightKg: number;
  readonly targetWeightKg?: number;
  readonly age: number;
  readonly gender: "Laki-laki" | "Perempuan";
  readonly activityLevel: string;
  readonly sleepHours?: string;
  readonly stepGoal?: number;
  readonly goal: string;
  readonly bmi: number;
  readonly estimatedDailyCalories: number;
};

export type OnboardingPreferences = {
  readonly preferredActivities: readonly string[];
  readonly reminderEnabled: boolean;
  readonly reminderIntervalMinutes: number;
  readonly privacyAccepted: boolean;
  readonly isVegetarian?: boolean;
  readonly allergies?: readonly string[];
  readonly favoriteFoods?: readonly string[];
  readonly favoriteWorkoutTime?: string;
};

export type AuthSession = {
  readonly name: string;
  readonly email: string;
  readonly username: string;
  readonly companionName: string;
  readonly companionAvatarId?: string;
  readonly avatarUrl?: string;
  readonly coverUrl?: string;
  readonly provider?: "password" | "google";
  readonly baseline?: HealthBaseline;
  readonly preferences?: OnboardingPreferences;
  readonly createdAt: string;
  readonly lastLoginTimestamp?: number;
};

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function updateAuthSession(patch: Partial<AuthSession>) {
  const current = readAuthSession();
  if (!current) return;
  saveAuthSession({ ...current, ...patch });
}

