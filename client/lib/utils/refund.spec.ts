import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { describeRefundPayback } from "./refund.ts";

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
