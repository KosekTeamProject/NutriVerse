const PROTECTED_APP_ROUTES = [
  "/aktivitas",
  "/admin",
  "/challenge",
  "/companion",
  "/dashboard",
  "/health-pulse",
  "/healthy-days",
  "/journey",
  "/komunitas",
  "/leaderboard",
  "/pengaturan",
  "/profil",
  "/reward",
  "/scan",
  "/todays-journey",
] as const;

export function isProtectedAppPath(pathname: string) {
  return PROTECTED_APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
