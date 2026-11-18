import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isValidPhone, normalizePhone } from "./phone.ts";

describe("normalizePhone", () => {
  it("turns full-width digits and dashes into plain ones", () => assert.equal(normalizePhone("０９０－１２３４－５６７８"), "090-1234-5678"));
  it("handles the prolonged sound mark some keyboards use as a dash", () => assert.equal(normalizePhone("０９０ー１２３４ー５６７８"), "090-1234-5678"));
  it("handles a full-width plus and ideographic space", () => assert.equal(normalizePhone("＋８１　９０"), "+81 90"));
  it("leaves an ordinary number alone", () => assert.equal(normalizePhone("+81 90-1234-5678"), "+81 90-1234-5678"));
});

describe("isValidPhone", () => {
  const good = ["090-1234-5678", "09012345678", "０９０－１２３４－５６７８", "+81 90-1234-5678", "03-1234-5678", "0985-12-3456", "0120-123-456", "9812345678", "01-4123456"];
  const bad = ["", "123", "abcdefg", "12345678901", "+1 415 555 2671", "98123"];

  for (const n of good) it(`accepts ${n}`, () => assert.equal(isValidPhone(n), true));
  for (const n of bad) it(`rejects "${n}"`, () => assert.equal(isValidPhone(n), false));
});
