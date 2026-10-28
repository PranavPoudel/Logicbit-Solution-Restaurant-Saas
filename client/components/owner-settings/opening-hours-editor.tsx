// components/owner-settings/opening-hours-editor.tsx
"use client";

import type { DayHours } from "@/types/hours";
import { WEEK_ORDER, weekday } from "@/lib/utils/hours";

const MAX_SHIFTS = 3;
const TIMEZONES = ["Asia/Kathmandu", "Asia/Tokyo", "Asia/Kolkata", "UTC"];
const INPUT = "bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#E3A008]/40 focus:border-[#E3A008]";

export const DEFAULT_HOURS: DayHours[] = Array.from({ length: 7 }, (_, day) => ({ day, closed: false, shifts: [{ open: "10:00", close: "22:00" }] }));

export function OpeningHoursEditor({ value, timezone, onChange, onTimezoneChange }: { value: DayHours[]; timezone: string; onChange: (hours: DayHours[]) => void; onTimezoneChange: (timezone: string) => void }) {
  const dayOf = (day: number) => value.find((d) => d.day === day) ?? { day, closed: true, shifts: [] };
  const update = (day: number, patch: Partial<DayHours>) => onChange(WEEK_ORDER.map((d) => (d === day ? { ...dayOf(d), ...patch } : dayOf(d))));
  const setShift = (day: number, index: number, key: "open" | "close", time: string) =>
    update(day, { shifts: dayOf(day).shifts.map((s, i) => (i === index ? { ...s, [key]: time } : s)) });
  const copyMonday = () => onChange(WEEK_ORDER.map((d) => ({ ...dayOf(1), day: d, shifts: dayOf(1).shifts.map((s) => ({ ...s })) })));
  const zones = TIMEZONES.includes(timezone) ? TIMEZONES : [timezone, ...TIMEZONES];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm font-medium text-neutral-700">
          Time zone
          <select value={timezone} onChange={(e) => onTimezoneChange(e.target.value)} className={`${INPUT} mt-1.5 block`}>
            {zones.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </label>
        <button type="button" onClick={copyMonday} className="text-sm font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900">Copy Monday to every day</button>
      </div>

      <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
        {WEEK_ORDER.map((day) => {
          const d = dayOf(day);
          return (
            <li key={day} className="flex flex-wrap items-start gap-x-4 gap-y-2 px-3.5 py-3">
              <label className="flex w-36 shrink-0 cursor-pointer items-center gap-2 pt-1.5 text-sm font-medium text-neutral-800">
                <input type="checkbox" checked={!d.closed} onChange={(e) => update(day, { closed: !e.target.checked, shifts: e.target.checked && d.shifts.length === 0 ? [{ open: "10:00", close: "22:00" }] : d.shifts })} className="h-4 w-4 accent-[#E3A008]" />
                {weekday(day, "en")}
              </label>
              {d.closed ? (
                <span className="pt-1.5 text-sm text-neutral-400">Closed</span>
              ) : (
                <div className="space-y-2">
                  {d.shifts.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="time" aria-label={`${weekday(day, "en")} opens`} value={s.open} onChange={(e) => setShift(day, i, "open", e.target.value)} className={INPUT} />
                      <span className="text-sm text-neutral-400">to</span>
                      <input type="time" aria-label={`${weekday(day, "en")} closes`} value={s.close} onChange={(e) => setShift(day, i, "close", e.target.value)} className={INPUT} />
                      {d.shifts.length > 1 && (
                        <button type="button" aria-label="Remove shift" onClick={() => update(day, { shifts: d.shifts.filter((_, n) => n !== i) })} className="px-2 text-lg leading-none text-neutral-400 hover:text-red-600">×</button>
                      )}
                    </div>
                  ))}
                  {d.shifts.length < MAX_SHIFTS && (
                    <button type="button" onClick={() => update(day, { shifts: [...d.shifts, { open: "17:00", close: "22:00" }] })} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">+ Add a second shift</button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-neutral-400">A closing time earlier than the opening time means you close after midnight, for example 18:00 to 02:00.</p>
    </div>
  );
}
