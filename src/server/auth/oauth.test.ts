import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "./oauth";

test("safeRedirectPath accepts internal application paths", () => {
  assert.equal(safeRedirectPath("/dashboard"), "/dashboard");
  assert.equal(
    safeRedirectPath("/onboarding?oauth=complete"),
    "/onboarding?oauth=complete",
  );
});

test("safeRedirectPath rejects external and protocol-relative redirects", () => {
  assert.equal(safeRedirectPath("https://example.com"), "/dashboard");
  assert.equal(safeRedirectPath("//example.com/path"), "/dashboard");
  assert.equal(safeRedirectPath(null), "/dashboard");
});
