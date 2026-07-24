import assert from "node:assert/strict";
import test from "node:test";
import { isProtectedAppPath } from "./route-access";

test("personal application pages require an authenticated session", () => {
  assert.equal(isProtectedAppPath("/dashboard"), true);
  assert.equal(isProtectedAppPath("/dashboard/weekly"), true);
  assert.equal(isProtectedAppPath("/profil"), true);
  assert.equal(isProtectedAppPath("/aktivitas"), true);
});

test("public and authentication routes remain accessible", () => {
  assert.equal(isProtectedAppPath("/"), false);
  assert.equal(isProtectedAppPath("/onboarding"), false);
  assert.equal(isProtectedAppPath("/bantuan"), false);
  assert.equal(isProtectedAppPath("/api/auth/callback"), false);
});
