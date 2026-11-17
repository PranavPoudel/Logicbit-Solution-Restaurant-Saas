import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeRefundPayback, gatewayRefundMethod } from "./refund.ts";

describe("describeRefundPayback", () => {
  it("names the method and adds the reference when there is one", () => {
    assert.equal(describeRefundPayback("BANK_TRANSFER", "TX-77"), "Bank transfer, ref TX-77");
    assert.equal(describeRefundPayback("CASH"), "Cash");
  });

  it("returns nothing for older refunds with no method", () => {
    assert.equal(describeRefundPayback(null, "x"), "");
    assert.equal(describeRefundPayback(undefined), "");
  });
});

describe("gatewayRefundMethod", () => {
  it("sends refunds back through the gateway the customer paid with", () => {
    assert.equal(gatewayRefundMethod("PAYPAY"), "PAYPAY");
    assert.equal(gatewayRefundMethod("CREDIT_CARD"), "CARD");
  });

  it("has no gateway for cash and other orders", () => {
    assert.equal(gatewayRefundMethod("COD"), null);
    assert.equal(gatewayRefundMethod(undefined), null);
  });

  it("names the card refund so an owner sees it", () => {
    assert.equal(describeRefundPayback("CARD", "re_123"), "Card, ref re_123");
  });
});
