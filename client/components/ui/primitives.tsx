// components/ui/primitives.tsx
"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useTranslations } from "next-intl";

/* ---------- Icons (one stroke set, used everywhere) ---------- */
const P: Record<string, ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />,
  share: <><path d="M12 3v12" /><path d="M7 8l5-5 5 5" /><path d="M5 14v5h14v-5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z" />,
  alert: <><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v4M12 17.5v.5" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  bike: <><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h5l3 7M10 10L8 6H5M15 10l-1-3h3" /></>,
  ticket: <><path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4V8z" /><path d="M10 6v12" strokeDasharray="2 2" /></>,
  leaf: <path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7" />,
  flame: <path d="M12 21c-4 0-7-2.7-7-6.5 0-4 4-6 4-10 3 1.5 4.5 4 4.5 6 1-1 1.5-2 1.5-3 2 1.5 4 4 4 7 0 4-3 6.5-7 6.5z" />,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /><path d="M10 11v5M14 11v5" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-1 .6-1.5 1.2-1.5 2.5M12 17v.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  logout: <><path d="M10 4H5v16h5" /><path d="M15 8l4 4-4 4M19 12H9" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4M6.5 6.7C3.9 8.4 2 12 2 12s3.5 7 10 7a10 10 0 004.1-.9" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bowl: <><path d="M3 11h18a9 9 0 01-18 0z" /><path d="M8 7c0-1.5 1-2 1-3.5M12 7c0-1.5 1-2 1-3.5M16 7c0-1.5 1-2 1-3.5" /></>,
  cup: <><path d="M6 8h12l-1.3 11a2 2 0 01-2 1.8H9.3a2 2 0 01-2-1.8L6 8z" /><path d="M5 8h14M13 3l1.5 5" /></>,
  cake: <><path d="M4 20h16v-6H4z" /><path d="M6 14v-3h12v3M12 11V7M12 4.5v.5" /></>,
  burger: <><path d="M4 11a8 6 0 0116 0z" /><path d="M3 14h18M4 17h16" /><path d="M5 17a2 2 0 002 2h10a2 2 0 002-2" /></>,
  fries: <><path d="M6 10l1.5 10h9L18 10z" /><path d="M8 10V4M11 10V3M14 10V4M17 10V6" /></>,
  pizza: <><path d="M3 6c6-4 12-4 18 0L12 21z" /><circle cx="10" cy="9" r="1" /><circle cx="14" cy="11" r="1" /></>,
  utensils: <><path d="M5 3v6a2 2 0 002 2v10M9 3v6a2 2 0 01-2 2" /><path d="M17 21V3c-2 1.5-3 4-3 7h3" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></>,
  rows: <><rect x="3" y="4" width="6" height="6" rx="2" /><rect x="3" y="14" width="6" height="6" rx="2" /><path d="M12 7h9M12 17h9" /></>,
  store: <><path d="M4 9l1.5-5h13L20 9" /><path d="M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9" /><path d="M5 12v8h14v-8" /></>,
};

export const Icon = ({ name, className = "h-5 w-5", fill = false }: { name: string; className?: string; fill?: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {P[name]}
  </svg>
);

/* ---------- Doodles ---------- */
export const Squiggle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 300 24" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
    <path d="M3 15c25-12 45 10 70 0s45-12 70 0 45 10 70 0 45-12 84-2" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
export const Arrow = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 100 80" className={className} fill="none" aria-hidden>
    <path d="M5 10c30 0 60 15 70 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 55l15 12 8-18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const Circle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 90" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
    <path d="M150 12C100-2 15 8 8 45s80 45 150 30 45-55-25-62" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);
export const Stamp = ({ text, className = "", children }: { text: string; className?: string; children?: ReactNode }) => (
  <div className={`grid place-items-center rounded-full ${className}`}>
    <svg viewBox="0 0 100 100" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
      <defs><path id="stamp-c" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" /></defs>
      <text fontSize="11" fontWeight="700" letterSpacing="2" fill="currentColor"><textPath href="#stamp-c">{text}</textPath></text>
    </svg>
    {children ?? <span className="text-3xl">★</span>}
  </div>
);

/* ---------- Core components ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "accent" | "ink" | "outline" | "ghost" | "saffron";
  size?: "md" | "lg";
  full?: boolean;
};
export function Button({ variant = "accent", size = "md", full, className = "", children, ...p }: BtnProps) {
  const v = {
    accent: "bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))] shadow-red hover:-translate-y-0.5",
    ink: "bg-ink text-cream shadow-soft hover:-translate-y-0.5",
    saffron: "bg-saffron text-espresso shadow-soft hover:-translate-y-0.5",
    outline: "border-2 border-ink text-ink hover:bg-ink hover:text-cream",
    ghost: "text-ink hover:bg-ink/10",
  }[variant];
  const s = size === "lg" ? "h-14 px-7 text-lg" : "min-h-11 px-5 text-base";
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${v} ${s} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export const IconButton = ({ icon, label, className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: string; label: string }) => (
  <button type="button" aria-label={label} {...p} className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition hover:scale-105 ${className}`}>
    <Icon name={icon} />
  </button>
);

export const Chip = ({ active, children, className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
  <button
    type="button"
    {...p}
    className={`min-h-11 shrink-0 rounded-full border-2 px-4 text-base font-bold transition ${
      active ? "border-[var(--accent,var(--brand-chili))] bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "border-ink/20 bg-paper text-ink hover:border-ink"
    } ${className}`}
  >
    {children}
  </button>
);

export function Badge({ tone = "ink", children, className = "" }: { tone?: "ink" | "herb" | "chili" | "saffron" | "soft"; children: ReactNode; className?: string }) {
  const t = { ink: "bg-ink text-cream", herb: "bg-herb text-parchment", chili: "bg-chili text-parchment", saffron: "bg-saffron text-espresso", soft: "bg-ink/10 text-ink" }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-base font-bold ${t} ${className}`}>{children}</span>;
}
export function OpenBadge({ open }: { open: boolean }) {
  const t = useTranslations("common");
  return (
    <Badge tone={open ? "herb" : "ink"}>
      <span className={`h-2.5 w-2.5 rounded-full ${open ? "animate-pulse bg-parchment" : "bg-chili"}`} />
      {open ? t("openNow") : t("closed")}
    </Badge>
  );
}

export function Stepper({ value, onChange, min = 0, small }: { value: number; onChange: (n: number) => void; min?: number; small?: boolean }) {
  const t = useTranslations("common");
  const removing = value <= 1 && min === 0;
  return (
    <div className={`inline-flex items-center rounded-full border-2 border-ink/20 bg-paper ${small ? "" : "p-0.5"}`}>
      <IconButton
        icon={removing ? "trash" : "minus"}
        label={removing ? t("remove") : t("decreaseQty")}
        title={removing ? t("remove") : undefined}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        className={`disabled:opacity-30 ${removing ? "text-chili hover:bg-chili/10" : "hover:bg-ink/10"}`}
      />
      <span className="w-8 text-center font-display text-xl font-extrabold" aria-live="polite">{value}</span>
      <IconButton icon="plus" label={t("increaseQty")} onClick={() => onChange(value + 1)} className="hover:bg-ink/10" />
    </div>
  );
}

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-[28px] bg-paper p-5 shadow-warm md:p-7 ${className}`}>{children}</div>
);
export const SectionTitle = ({ n, children, aside }: { n?: number; children: ReactNode; aside?: ReactNode }) => (
  <div className="mb-5 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold md:text-3xl">
      {n && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron text-xl text-espresso">{n}</span>}
      {children}
    </h2>
    {aside}
  </div>
);

export function AllergenAlert({ text: raw, compact }: { text: string; compact?: boolean }) {
  const t = useTranslations("common");
  const text = raw.replace(/^contains:?\s+/i, "");
  return compact ? (
    <span role="note" className="mt-2 inline-flex items-start gap-1.5 rounded-2xl bg-chili/10 px-3 py-1 font-bold text-danger">
      <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />{t("containsCompact", { text })}
    </span>
  ) : (
    <div role="note" className="flex items-start gap-3 rounded-2xl border-2 border-chili bg-chili/10 p-4 text-ink">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-chili text-parchment"><Icon name="alert" /></span>
      <p><b className="text-chili">{t("contains", { text })}</b> {t("allergyNote")}</p>
    </div>
  );
}

export function RefundNote({ text, className = "" }: { text?: string | null; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className={`flex gap-3 rounded-2xl border border-herb/25 bg-herb/10 p-4 ${className}`}>
      <Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-herb" />
      <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">
        <b>{t("refundTitle")}</b> {text?.trim() || t("refundFallback")}
      </p>
    </div>
  );
}

export function Choice({ type, checked, onChange, label, extra, disabled, name }: { type: "radio" | "checkbox"; checked: boolean; onChange: () => void; label: string; extra?: string; disabled?: boolean; name?: string }) {
  return (
    <label className={`relative flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-2 transition ${checked ? "border-[var(--accent,var(--brand-chili))] bg-[var(--accent,var(--brand-chili))]/10" : "border-ink/15 hover:border-ink/40"} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="peer sr-only" />
      <span className={`grid h-6 w-6 shrink-0 place-items-center border-2 peer-focus-visible:ring-4 peer-focus-visible:ring-saffron ${type === "radio" ? "rounded-full" : "rounded-md"} ${checked ? "border-[var(--accent,var(--brand-chili))] bg-[var(--accent,var(--brand-chili))] text-[var(--accent-ink,var(--brand-parchment))]" : "border-ink/40"}`}>
        {checked && (type === "radio" ? <span className="h-2.5 w-2.5 rounded-full bg-current" /> : <Icon name="check" className="h-4 w-4" />)}
      </span>
      <span className="flex-1 font-medium">{label}</span>
      {extra && <span className="font-bold text-ink/70">{extra}</span>}
    </label>
  );
}

export const inputCls = "min-h-12 w-full rounded-2xl border-2 border-ink/20 bg-paper px-4 text-base text-ink outline-none placeholder:text-ink/50 focus:border-ink";

export function Progress({ step, steps }: { step: number; steps?: string[] }) {
  const t = useTranslations("common");
  const labels = steps ?? [t("stepCart"), t("stepDetails"), t("stepPayment")];
  return (
    <ol className="flex items-center gap-2" aria-label={t("progress")}>
      {labels.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={i === step ? "step" : undefined}>
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg font-extrabold ${i < step ? "bg-herb text-parchment" : i === step ? "bg-chili text-parchment ring-4 ring-chili/25" : "bg-ink/10 text-ink/60"}`}>
            {i < step ? <Icon name="check" /> : i + 1}
          </span>
          <span className={`font-bold ${i === step ? "" : "text-ink/60"} ${labels.length > 3 ? "hidden md:inline" : ""}`}>{s}</span>
          {i < labels.length - 1 && <span className={`mx-1 h-1 flex-1 rounded-full ${i < step ? "bg-herb" : "bg-ink/10"}`} />}
        </li>
      ))}
    </ol>
  );
}
