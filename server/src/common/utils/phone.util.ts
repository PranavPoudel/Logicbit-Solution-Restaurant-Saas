const CALLING_CODES: Record<string, string> = { JP: '81', JAPAN: '81', NP: '977', NEPAL: '977' };

/**
 * Turns a phone number as people type it ("090-1234-5678", "+81 90 1234 5678") into international
 * E.164 form ("+819012345678"). A local number needs the restaurant's country to know its calling code.
 * Returns null when the number cannot be made international with confidence.
 */
export function toE164(raw: string | null | undefined, country?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/[\s().-]/g, '');
  if (!/^\+?\d+$/.test(cleaned)) return null;

  let digits: string;
  if (cleaned.startsWith('+')) digits = cleaned.slice(1);
  else if (cleaned.startsWith('00')) digits = cleaned.slice(2);
  else {
    const code = CALLING_CODES[(country ?? '').trim().toUpperCase()];
    if (!code) return null;
    digits = code + cleaned.replace(/^0/, '');
  }
  return /^[1-9]\d{6,14}$/.test(digits) ? `+${digits}` : null;
}
