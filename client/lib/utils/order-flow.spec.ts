import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ageLabel, flowFor, nextStep, shortNumber, stageLabel, stepIndex, urgency } from "./order-flow.ts";

describe("flowFor", () => {
  it("ends delivery orders at Delivered with an on-the-way step", () => {
    assert.deepEqual(flowFor("DELIVERY").map((s) => s.label), ["New", "Accepted", "Preparing", "Ready", "On the way", "Delivered"]);
  });

  it("skips the delivery step for pickup and dine-in", () => {
    assert.deepEqual(flowFor("PICKUP").map((s) => s.label), ["New", "Accepted", "Preparing", "Ready", "Collected"]);
    assert.deepEqual(flowFor("DINE_IN").map((s) => s.label), ["New", "Accepted", "Preparing", "Ready", "Served"]);
  });
});

describe("nextStep", () => {
  const cases: [string, string | undefined, string | undefined][] = [
    ["PENDING", "DELIVERY", "ACCEPTED"],
    ["PREPARING", "PICKUP", "READY"],
    ["READY", "DELIVERY", "OUT_FOR_DELIVERY"],
    ["READY", "PICKUP", "DELIVERED"],
    ["READY", "DINE_IN", "DELIVERED"],
    ["OUT_FOR_DELIVERY", "DELIVERY", "DELIVERED"],
    ["DELIVERED", "DELIVERY", undefined],
    ["CANCELLED", "PICKUP", undefined],
  ];
  for (const [status, type, expected] of cases) {
    it(`${status} ${type} -> ${expected}`, () => assert.equal(nextStep(status, type)?.next, expected));
  }
});

describe("stepIndex and stageLabel", () => {
  it("treats DELIVERED and COMPLETED as the last step of any flow", () => {
    assert.equal(stepIndex("DELIVERED", "PICKUP"), 4);
    assert.equal(stepIndex("COMPLETED", "DELIVERY"), 5);
  });

  it("labels the final step by order type", () => {
    assert.equal(stageLabel("COMPLETED", "PICKUP"), "Collected");
    assert.equal(stageLabel("CANCELLED", "PICKUP"), "Cancelled");
  });
});

describe("shortNumber, ageLabel, urgency", () => {
  it("keeps only the trailing part of an order number", () => {
    assert.equal(shortNumber({ id: "abcdef123", orderNumber: "ORD-1793075497224-7853" }), "7853");
    assert.equal(shortNumber({ id: "abcdef123" }), "ABCDEF");
  });

  it("formats ages", () => {
    assert.equal(ageLabel(0), "Just now");
    assert.equal(ageLabel(42), "42 min");
    assert.equal(ageLabel(125), "2 h 5 min");
    assert.equal(ageLabel(3000), "2 d");
  });

  it("only flags new orders as urgent", () => {
    assert.equal(urgency("PENDING", 4), "ok");
    assert.equal(urgency("PENDING", 5), "warn");
    assert.equal(urgency("PENDING", 10), "late");
    assert.equal(urgency("PREPARING", 90), "ok");
  });
});
