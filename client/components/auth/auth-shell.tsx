// components/auth/auth-shell.tsx
"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, IconButton, Squiggle, Stamp } from "@/components/ui/primitives";

type Mode = "login" | "signup";

const inputBase = "min-h-14 w-full rounded-2xl border-2 bg-paper pl-12 pr-4 text-base text-ink outline-none placeholder:text-ink/50 transition focus:border-ink";

export function AuthInput({ id, label, icon, error, hint, right, ...p }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; icon: string; error?: string; hint?: ReactNode; right?: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-bold">{label}</label>
      <div className="relative">
        <Icon name={icon} className={`pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 ${error ? "text-chili" : "text-ink/50"}`} />
        <input id={id} aria-invalid={!!error} aria-describedby={`${id}-msg`} {...p} className={`${inputBase} ${error ? "border-chili" : "border-ink/15"} ${right ? "pr-14" : ""}`} />
        {right && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      <div id={`${id}-msg`}>
        {error ? (
          <p className="mt-2 flex items-center gap-1.5 font-medium text-danger" role="alert"><Icon name="alert" className="h-4 w-4" />{error}</p>
        ) : (
          hint
        )}
      </div>
    </div>
  );
}

export function AuthPassword({ id, label, error, hint, ...p }: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: ReactNode }) {
  const t = useTranslations("auth");
  const [show, setShow] = useState(false);
  return (
    <AuthInput
      id={id}
      label={label}
      icon="lock"
      type={show ? "text" : "password"}
      placeholder="••••••••"
      error={error}
      hint={hint}
      right={<IconButton icon={show ? "eyeOff" : "eye"} label={show ? t("hidePassword") : t("showPassword")} onClick={() => setShow(!show)} className="text-ink/60 hover:bg-ink/5" />}
      {...p}
    />
  );
}

export function PasswordStrength({ value, min = 6 }: { value: string; min?: number }) {
  const t = useTranslations("auth");
  const score = [value.length >= 8, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
  const colors = ["bg-ink/15", "bg-chili", "bg-saffron", "bg-herb", "bg-herb"];
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition ${i < score ? colors[score] : "bg-ink/10"}`} />
        ))}
      </div>
      <p className="mt-1.5 text-ink/65">{value ? t(`strength.${score}`) : t("passwordHint", { min })}</p>
    </div>
  );
}

export function AuthError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-2xl border-2 border-chili bg-chili/10 p-4">
      <Icon name="alert" className="h-5 w-5 shrink-0 text-chili" />
      <p className="font-medium">{children}</p>
    </div>
  );
}

export function AuthSubmit({ pending, children, pendingLabel }: { pending: boolean; children: ReactNode; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-14 w-full items-center justify-between gap-2 rounded-full bg-[var(--accent,var(--brand-chili))] px-6 text-lg font-bold text-[var(--accent-ink,var(--brand-parchment))] shadow-red transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
    >
      {pending ? (
        <span className="flex items-center gap-2"><span className="h-5 w-5 animate-spin rounded-full border-[3px] border-current border-t-transparent" />{pendingLabel}</span>
      ) : (
        <span>{children}</span>
      )}
      <Icon name="arrow" className="h-5 w-5" />
    </button>
  );
}

const COPY = {
  login: { img: "/images/cuisine-nepali.jpg.avif", img2: "/images/cuisine-newari.jpg.avif" },
  signup: { img: "/images/cuisine-fastfood.jpg.avif", img2: "/images/cuisine-desserts.jpg.avif" },
};
const MODES = ["login", "signup"] as const;
const fade = (on: boolean) => `transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`;

const PERKS = [
  { icon: "bike", key: "tracking" },
  { icon: "clock", key: "hot" },
  { icon: "ticket", key: "deals" },
] as const;

function Visual({ mode }: { mode: Mode }) {
  const t = useTranslations("auth");
  return (
    <div className="relative hidden min-h-[760px] overflow-hidden rounded-[36px] bg-saffron lg:block">
      <div className="blob absolute -left-24 -top-24 h-[420px] w-[420px] bg-chili" aria-hidden />
      <div className="blob absolute -bottom-24 -right-16 h-[260px] w-[260px] bg-tangerine" aria-hidden />
      <div className="absolute left-10 top-10 grid max-w-[260px]">
        {MODES.map((m) => (
          <p key={m} aria-hidden={mode !== m} className={`col-start-1 row-start-1 font-display text-[52px] font-extrabold leading-[0.92] tracking-tight text-parchment ${fade(mode === m)}`}>{t(`copy.${m}.line`)}</p>
        ))}
      </div>
      <Stamp text={t("stamp")} className="absolute right-8 top-8 h-28 w-28 rotate-12 bg-ink text-cream" />
      <div className="blob shadow-warm absolute right-[-48px] top-[28%] aspect-square w-[68%] overflow-hidden border-8 border-cream">
        {MODES.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m} src={COPY[m].img} alt="" className={`absolute inset-0 h-full w-full scale-110 object-cover ${fade(mode === m)}`} />
        ))}
      </div>
      <div className="arch shadow-warm absolute bottom-[30%] left-10 aspect-[3/4] w-[30%] -rotate-6 overflow-hidden border-8 border-cream">
        {MODES.map((m) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m} src={COPY[m].img2} alt="" className={`absolute inset-0 h-full w-full object-cover ${fade(mode === m)}`} />
        ))}
      </div>
      <span className="absolute left-[38%] top-[58%] rotate-6 rounded-xl bg-herb px-3 py-1 font-display text-lg font-bold text-parchment shadow-hard">{t("loved")}</span>
      <ul className="absolute inset-x-8 bottom-8 grid gap-3 rounded-[28px] bg-cream/95 p-5 text-ink shadow-warm">
        {PERKS.map((p) => (
          <li key={p.key} className="flex items-center gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-saffron text-espresso"><Icon name={p.icon} /></span>
            <span className="leading-tight"><b className="block font-display text-lg font-extrabold">{t(`perks.${p.key}.title`)}</b><span className="text-ink/75">{t(`perks.${p.key}.body`)}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AuthShell({ mode, children, footer }: { mode: Mode; children: ReactNode; footer: ReactNode }) {
  const t = useTranslations("auth");
  const c = COPY[mode];
  return (
    <div className="mx-auto grid max-w-[1440px] gap-8 p-4 md:p-6 lg:grid-cols-2">
      <div className="flex flex-col px-1 md:px-10">
        <div className="relative mt-2 h-40 overflow-hidden rounded-[28px] bg-saffron lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.img} alt="" className="blob absolute -right-10 -top-6 h-52 w-52 border-[6px] border-cream object-cover" />
          <p className="absolute bottom-5 left-5 max-w-[180px] font-display text-[32px] font-extrabold leading-[0.95] text-espresso">{t(`copy.${mode}.line`)}</p>
        </div>

        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center py-10">
          <div className="relative mb-8 grid grid-cols-2 rounded-full bg-ink/5 p-1" role="tablist" aria-label={t("account")}>
            <span
              aria-hidden
              className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-paper shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: mode === "signup" ? "translateX(100%)" : "none" }}
            />
            {MODES.map((m) => (
              <Link
                key={m}
                href={m === "login" ? "/login" : "/signup"}
                role="tab"
                aria-selected={mode === m}
                className={`relative grid min-h-12 place-items-center rounded-full font-bold transition-colors duration-300 ${mode === m ? "" : "text-ink/65 hover:text-ink"}`}
              >
                {m === "login" ? t("tabLogin") : t("tabSignup")}
              </Link>
            ))}
          </div>

          <div key={mode} className="animate-fade-up">
            <h1 className="font-display text-[40px] font-extrabold leading-[1.05] tracking-tight md:text-[48px]">
              {t(`copy.${mode}.title`)} <span className="relative inline-block">{t(`copy.${mode}.accent`)}<Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-chili" /></span>
            </h1>
            <p className="mt-3 text-lg text-ink/75">{t(`copy.${mode}.sub`)}</p>

            <div className="mt-8">{children}</div>
            <p className="mt-8 text-center text-lg">{footer}</p>
          </div>
        </div>
      </div>
      <Visual mode={mode} />
    </div>
  );
}
