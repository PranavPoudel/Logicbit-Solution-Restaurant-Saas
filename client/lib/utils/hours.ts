import type { DayHours, OpenStatus } from "@/types/hours";

type Translate = (key: string, values?: Record<string, string>) => string;

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const clock = (hhmm: string, locale: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(2000, 0, 1, h, m).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
};

export const weekday = (day: number, locale: string) => new Intl.DateTimeFormat(locale, { weekday: "long" }).format(new Date(2023, 0, 1 + day));

export const dayRanges = (hours: DayHours | undefined, locale: string) =>
  hours && !hours.closed && hours.shifts.length ? hours.shifts.map((s) => `${clock(s.open, locale)} – ${clock(s.close, locale)}`) : [];

export function describeOpen(status: OpenStatus | undefined, isOpen: boolean, t: Translate, locale: string) {
  const closes = isOpen && status?.closesAt ? clock(status.closesAt, locale) : undefined;
  const next = !isOpen ? status?.nextOpen : null;
  const opens = next
    ? next.offset === 0
      ? t("hours.opensToday", { time: clock(next.time, locale) })
      : next.offset === 1
        ? t("hours.opensTomorrow", { time: clock(next.time, locale) })
        : t("hours.opensOn", { day: weekday(next.day, locale), time: clock(next.time, locale) })
    : undefined;
  return { closes, opens, detail: closes ? t("hours.closesAt", { time: closes }) : opens };
}
