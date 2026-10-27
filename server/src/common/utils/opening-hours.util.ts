export interface Shift {
  open: string;
  close: string;
}

export interface DayHours {
  day: number;
  closed: boolean;
  shifts: Shift[];
}

export interface OpenStatus {
  isOpen: boolean;
  today: number;
  closesAt: string | null;
  nextOpen: { offset: number; day: number; time: string } | null;
}

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function localTime(now: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { day: WEEKDAYS.indexOf(get('weekday')), minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Open status from the weekly schedule, in the restaurant's own timezone.
 * A shift whose close is not after its open runs past midnight into the next day.
 * With no schedule the restaurant is treated as open; the manual isOpen switch still applies.
 */
export function computeOpenStatus(
  restaurant: { isOpen: boolean; openingHours?: unknown; timezone?: string | null },
  now = new Date(),
): OpenStatus {
  const hours = Array.isArray(restaurant.openingHours) ? (restaurant.openingHours as DayHours[]) : null;
  const { day: today, minute } = localTime(now, restaurant.timezone || 'Asia/Kathmandu');
  if (!hours) return { isOpen: restaurant.isOpen, today, closesAt: null, nextOpen: null };

  const shiftsOf = (day: number) => {
    const d = hours.find((h) => h.day === day);
    return d && !d.closed ? [...d.shifts].sort((a, b) => minutes(a.open) - minutes(b.open)) : [];
  };

  let closesAt: string | null = null;
  for (const s of shiftsOf(today)) {
    const o = minutes(s.open);
    const c = minutes(s.close);
    if (c > o ? minute >= o && minute < c : minute >= o) closesAt = s.close;
  }
  if (!closesAt) {
    for (const s of shiftsOf((today + 6) % 7)) {
      if (minutes(s.close) <= minutes(s.open) && minute < minutes(s.close)) closesAt = s.close;
    }
  }

  let nextOpen: OpenStatus['nextOpen'] = null;
  for (let offset = 0; offset <= 7 && !nextOpen; offset++) {
    const day = (today + offset) % 7;
    const start = shiftsOf(day).find((s) => offset > 0 || minutes(s.open) > minute);
    if (start) nextOpen = { offset, day, time: start.open };
  }

  return { isOpen: restaurant.isOpen && closesAt !== null, today, closesAt, nextOpen };
}
