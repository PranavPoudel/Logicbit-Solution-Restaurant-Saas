// lib/utils/phone.ts

const FULL_WIDTH_DIGITS = /[０-９]/g;
const DASHES = /[－‐‑–—―ー]/g;

/** Japanese keyboards type full-width digits and dashes (０９０－１２３４－５６７８); store the plain ASCII form so tel: links and SMS work. */
export function normalizePhone(value: string): string {
  return value
    .replace(FULL_WIDTH_DIGITS, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
    .replace(/＋/g, "+")
    .replace(DASHES, "-")
    .replace(/　/g, " ");
}

const JAPAN = /^0\d{9,10}$/; // 03-1234-5678, 090-1234-5678, 0120-123-456
const NEPAL = /^(9[78]\d{8}|0\d{1,2}\d{6,7})$/; // 98XXXXXXXX, 01-4XXXXXX

/** A Japanese or Nepali number, written however the owner types it: spaces, dashes, brackets, full-width digits or a +81 prefix. */
export function isValidPhone(value: string): boolean {
  let digits = normalizePhone(value).replace(/[\s().-]/g, "");
  if (digits.startsWith("+81")) digits = `0${digits.slice(3)}`;
  return JAPAN.test(digits) || NEPAL.test(digits);
}
