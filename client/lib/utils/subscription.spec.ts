import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { accessUntil, getSubscriptionState } from "./subscription.ts";

describe("getSubscriptionState", () => {
  const cases: [string, Parameters<typeof getSubscriptionState>[0], ReturnType<typeof getSubscriptionState>][] = [
    ["not loaded yet", undefined, null],
    ["no subscription", { status: "NO_SUBSCRIPTION" }, "none"],
    ["expired status", { status: "EXPIRED", daysRemaining: -2 }, "expired"],
    ["cancelled status", { status: "CANCELLED" }, "expired"],
    ["active but past its date", { status: "ACTIVE", daysRemaining: 0 }, "expired"],
    ["active, 7 days left", { status: "ACTIVE", daysRemaining: 7 }, "expiring"],
    ["active, 8 days left", { status: "ACTIVE", daysRemaining: 8 }, "active"],
    ["active, never expires", { status: "ACTIVE", daysRemaining: null }, "active"],
  ];

  for (const [name, input, expected] of cases) {
    it(name, () => assert.equal(getSubscriptionState(input), expected));
  }
});

describe("accessUntil", () => {
  const now = new Date("2026-10-28T00:00:00Z");
  const iso = (d: Date | null) => d?.toISOString().slice(0, 10);

  it("starts from today when there is no subscription", () => assert.equal(iso(accessUntil(null, 1, now)), "2026-11-28"));
  it("starts from today when the subscription already ended", () => assert.equal(iso(accessUntil("2026-09-01T00:00:00Z", 12, now)), "2027-10-28"));
  it("extends a live subscription from its expiry, so no paid days are lost", () => assert.equal(iso(accessUntil("2026-12-15T00:00:00Z", 1, now)), "2027-01-15"));
  it("never expires for a lifetime plan", () => assert.equal(accessUntil("2026-12-15T00:00:00Z", 0, now), null));
});
