// app/for-restaurants/page.tsx
"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { registerOwner } from "@/lib/api/auth";
import { geocodeAddress } from "@/lib/geocode";
import { useOwnerAuthStore } from "@/store/owner-auth-store";
import { theme } from "@/config/theme";
import { formatMoney } from "@/lib/utils/money";
import { Button, Card, Icon, Progress, Squiggle, Stamp } from "@/components/ui/primitives";
import { AuthError, AuthInput, AuthPassword, PasswordStrength } from "@/components/auth/auth-shell";

const STEPS = ["stepKitchen", "stepOwner", "stepReview"] as const;
const STEP_TITLES = ["titleKitchen", "titleOwner", "titleReview"] as const;

const HOW = [
  { key: "one", img: "/images/cuisine-newari.jpg.avif", cls: "md:-rotate-2 md:mt-10", shape: "blob h-44" },
  { key: "two", img: "/images/cuisine-nepali.jpg.avif", cls: "md:rotate-1", shape: "arch h-56" },
  { key: "three", img: "/images/cuisine-fastfood.jpg.avif", cls: "md:-rotate-1 md:mt-20", shape: "blob h-44" },
] as const;

const BENEFITS = [
  { icon: "ticket", key: "reach" },
  { icon: "bike", key: "delivery" },
  { icon: "clock", key: "realtime" },
  { icon: "flame", key: "menu" },
] as const;

const FAQ = ["cost", "orders", "menu", "live"] as const;

function Hero({ onStart }: { onStart: () => void }) {
  const t = useTranslations("partner");
  return (
    <section className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 pb-16 pt-8 md:px-10 lg:grid-cols-[1.05fr_1fr]">
      <div>
        <span className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-ink px-4 py-2 font-bold text-cream">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-saffron" />{t("badge")}
        </span>
        <h1 className="mt-6 font-display text-[52px] font-extrabold leading-[0.92] tracking-[-0.04em] md:text-[96px]">
          {t("titleStart")}{" "}
          <span className="relative inline-block text-chili-deep">
            {t("titleAccent")}<Squiggle className="absolute -bottom-2 left-0 h-4 w-full text-saffron md:-bottom-3 md:h-6" />
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink/85">{t("body")}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button size="lg" onClick={onStart}>{t("start")}<Icon name="arrow" className="h-5 w-5" /></Button>
          <Link href="/owner/login" className="min-h-11 font-bold underline underline-offset-4 hover:text-danger">{t("alreadyListed")}</Link>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-ink/80">
          {(["noSetup", "ownDashboard", "cancelAny"] as const).map((k) => (
            <li key={k} className="flex items-center gap-2"><Icon name="check" className="h-5 w-5 text-herb-ink" />{t(k)}</li>
          ))}
        </ul>
      </div>

      <div className="relative h-[380px] overflow-hidden rounded-[36px] bg-crimson md:h-[560px]">
        <div className="shadow-warm absolute right-6 top-10 aspect-square w-[72%] max-w-[420px] rotate-2 overflow-hidden rounded-[32px] border-8 border-cream md:right-10 md:top-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cuisine-nepali.jpg.avif" alt={t("alt1")} className="h-full w-full object-cover" />
        </div>
        <div className="shadow-warm absolute bottom-6 left-6 h-[180px] w-[130px] -rotate-6 overflow-hidden rounded-[28px] border-8 border-cream md:bottom-10 md:left-10 md:h-[260px] md:w-[190px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cuisine-newari.jpg.avif" alt={t("alt2")} className="h-full w-full object-cover" />
        </div>
        <Stamp text={t("stamp")} className="absolute left-6 top-6 h-24 w-24 -rotate-12 bg-ink text-cream md:left-10 md:top-10 md:h-32 md:w-32" />
        <span className="absolute bottom-10 right-6 rotate-6 rounded-2xl bg-paper px-4 py-2 shadow-hard md:bottom-16 md:right-12">
          <span className="block font-bold text-ink/75">{t("setupFee")}</span>
          <span className="font-display text-3xl font-extrabold text-ink">{formatMoney(0)}</span>
        </span>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useTranslations("partner");
  return (
    <section aria-labelledby="how" className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
      <h2 id="how" className="font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">{t("howTitle")}</h2>
      <ol className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
        {HOW.map((s, i) => (
          <li key={s.key} className={`${s.cls} relative rounded-[32px] bg-paper p-6 shadow-warm`}>
            <span className="absolute -top-5 left-6 grid h-14 w-14 place-items-center rounded-full bg-saffron font-display text-2xl font-extrabold text-espresso shadow-soft">{i + 1}</span>
            <h3 className="mt-6 font-display text-[28px] font-extrabold leading-tight">{t(`how.${s.key}.title`)}</h3>
            <p className="mt-2 text-ink/80">{t(`how.${s.key}.body`)}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.img} alt="" className={`mt-5 w-full object-cover ${s.shape}`} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function Benefits() {
  const t = useTranslations("partner");
  return (
    <section aria-label={t("whyBrand", { brand: theme.brand.name })} className="bg-ink py-12 text-cream">
      <ul className="mx-auto grid max-w-[1440px] gap-8 px-5 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
        {BENEFITS.map((x) => (
          <li key={x.key} className="flex gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-saffron text-espresso"><Icon name={x.icon} className="h-7 w-7" /></span>
            <div>
              <p className="font-display text-2xl font-extrabold">{t(`benefits.${x.key}.title`)}</p>
              <p className="text-cream/85">{t(`benefits.${x.key}.body`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Faq() {
  const t = useTranslations("partner");
  return (
    <section aria-labelledby="faq" className="mx-auto max-w-[1440px] px-5 py-16 md:px-10">
      <h2 id="faq" className="font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">{t("faqTitle")}</h2>
      <dl className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
        {FAQ.map((k) => (
          <div key={k} className="border-t-2 border-ink/10 pt-5">
            <dt className="font-display text-2xl font-extrabold">{t(`faq.${k}.q`)}</dt>
            <dd className="mt-2 text-lg text-ink/80">{t(`faq.${k}.a`)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SummaryCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  const t = useTranslations("partner");
  return (
    <div className="rounded-[28px] border-2 border-ink/10 bg-cream p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-2xl font-extrabold">{title}</h3>
        <button type="button" onClick={onEdit} className="min-h-11 px-2 font-bold underline underline-offset-4 hover:text-danger">{t("edit")}</button>
      </div>
      <div className="space-y-1 text-ink/85">{children}</div>
    </div>
  );
}

function Wizard() {
  const t = useTranslations("partner");
  const tc = useTranslations("common");
  const router = useRouter();
  const setAuth = useOwnerAuthStore((s) => s.setAuth);
  const top = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [k, setK] = useState({ restaurantName: "", phone: "", restaurantAddress: "" });
  const [o, setO] = useState({ name: "", email: "", password: "" });
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async () => {
      const place = await geocodeAddress(k.restaurantAddress).catch(() => null);
      if (!place) throw new Error(t("errGeocode"));
      const response = await registerOwner({ ...o, ...k, latitude: place.lat, longitude: place.lng, acceptTerms: terms });
      if (!(response.tokens || response.data?.tokens) || !(response.user || response.data?.user)) {
        throw new Error(response.message ?? t("errFailed"));
      }
      return response;
    },
    onSuccess: (response) => {
      const tokens = response.tokens || response.data?.tokens;
      const user = response.user || response.data?.user;
      setAuth({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user, restaurants: response.restaurants || response.data?.restaurants || [] });
      router.push("/owner/dashboard");
    },
  });

  const serverError = mutation.isError
    ? (() => {
        const msg = (mutation.error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
        return Array.isArray(msg) ? msg.join(", ") : msg ?? (mutation.error as Error).message ?? t("errGeneric");
      })()
    : null;

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (k.restaurantName.trim().length < 2) e.restaurantName = t("errKitchen");
      if (!/^(9[78]\d{8}|0\d{1,2}\d{6,7})$/.test(k.phone.replace(/[\s-]/g, ""))) e.phone = t("errPhone");
      if (k.restaurantAddress.trim().length < 4) e.restaurantAddress = t("errAddress");
    }
    if (s === 1) {
      if (o.name.trim().length < 2) e.name = t("errName");
      if (!/^\S+@\S+\.\S+$/.test(o.email)) e.email = t("errEmail");
      if (o.password.length < 8 || !/\d/.test(o.password)) e.password = t("errPassword");
    }
    if (s === 2 && !terms) e.terms = t("errTerms");
    setErr(e);
    return !Object.keys(e).length;
  };

  const goTo = (i: number) => {
    setStep(i);
    setErr({});
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const next = () => validate(step) && goTo(step + 1);
  const submit = () => validate(2) && mutation.mutate();

  return (
    <div ref={top} id="apply" className="scroll-mt-6">
      <Card className="!rounded-[36px] !p-5 md:!p-10">
        <p className="font-bold text-ink/75">{t("stepOf", { step: step + 1, total: STEPS.length })}</p>
        <h2 className="font-display text-[36px] font-extrabold leading-tight md:text-[48px]">{t(STEP_TITLES[step])}</h2>
        <div className="mt-6"><Progress step={step} steps={STEPS.map((s) => t(s))} /></div>

        <div key={step} className="animate-fade-up mt-10">
          {step === 0 && (
            <div className="grid gap-6 md:grid-cols-2">
              <AuthInput id="restaurantName" label={t("kitchenName")} icon="bag" value={k.restaurantName} onChange={(e) => setK({ ...k, restaurantName: e.target.value })} error={err.restaurantName} placeholder="Sita's Momo Pasal" />
              <AuthInput id="phone" label={t("kitchenPhone")} icon="phone" inputMode="tel" value={k.phone} onChange={(e) => setK({ ...k, phone: e.target.value })} error={err.phone} autoComplete="tel" placeholder="98XXXXXXXX" />
              <div className="md:col-span-2">
                <AuthInput id="restaurantAddress" label={t("address")} icon="pin" value={k.restaurantAddress} onChange={(e) => setK({ ...k, restaurantAddress: e.target.value })} error={err.restaurantAddress} placeholder="Mangal Bazaar, near Patan Durbar Square" hint={<p className="mt-2 text-ink/75">{t("addressHint")}</p>} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <AuthInput id="name" label={t("fullName")} icon="user" value={o.name} onChange={(e) => setO({ ...o, name: e.target.value })} error={err.name} autoComplete="name" placeholder="Sita Maharjan" />
              <AuthInput id="email" label={t("email")} icon="mail" type="email" value={o.email} onChange={(e) => setO({ ...o, email: e.target.value })} error={err.email} autoComplete="email" placeholder="sita@gmail.com" />
              <div className="md:col-span-2 md:max-w-[calc(50%-12px)]">
                <AuthPassword id="password" label={t("createPassword")} value={o.password} onChange={(e) => setO({ ...o, password: e.target.value })} error={err.password} autoComplete="new-password" hint={<PasswordStrength value={o.password} min={8} />} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard title={t("stepKitchen")} onEdit={() => goTo(0)}>
                  <p className="font-bold text-ink">{k.restaurantName}</p>
                  <p>{k.restaurantAddress}</p>
                  <p>{k.phone}</p>
                </SummaryCard>
                <SummaryCard title={t("stepOwner")} onEdit={() => goTo(1)}>
                  <p className="font-bold text-ink">{o.name}</p>
                  <p>{o.email}</p>
                </SummaryCard>
              </div>
              {serverError && <AuthError>{serverError}</AuthError>}
              <div>
                <label className="flex cursor-pointer gap-3 rounded-2xl bg-ink/5 p-4">
                  <input type="checkbox" checked={terms} onChange={() => { setTerms(!terms); setErr({}); }} aria-invalid={!!err.terms} className="mt-0.5 h-6 w-6 shrink-0 accent-chili-deep" />
                  <span>{t("terms", { brand: theme.brand.name })}</span>
                </label>
                {err.terms && <p role="alert" className="mt-2 flex items-center gap-1.5 font-medium text-danger"><Icon name="alert" className="h-4 w-4 shrink-0" />{err.terms}</p>}
              </div>
              <Button size="lg" full onClick={submit} disabled={mutation.isPending} aria-busy={mutation.isPending} className="!h-16 !text-xl">
                {mutation.isPending ? (
                  <><span className="h-6 w-6 animate-spin rounded-full border-[3px] border-current border-t-transparent" />{t("creating")}</>
                ) : mutation.isError ? (
                  t("tryAgain")
                ) : (
                  <>{t("create")}<Icon name="arrow" className="h-5 w-5" /></>
                )}
              </Button>
            </div>
          )}
        </div>

        {step < 2 && (
          <div className="mt-10 flex items-center justify-between gap-3 border-t-2 border-ink/10 pt-6">
            {step > 0 ? <Button variant="ghost" onClick={() => goTo(step - 1)}><Icon name="back" className="h-5 w-5" />{tc("back")}</Button> : <span />}
            <Button size="lg" onClick={next}>{tc("continue")}<Icon name="arrow" className="h-5 w-5" /></Button>
          </div>
        )}
        {step === 2 && (
          <div className="mt-6">
            <Button variant="ghost" onClick={() => goTo(1)}><Icon name="back" className="h-5 w-5" />{tc("back")}</Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ForRestaurantsPage() {
  const t = useTranslations("partner");
  return (
    <div style={{ "--accent": "var(--brand-chili-deep)", "--accent-ink": "var(--brand-parchment)" } as CSSProperties}>
      <Hero onStart={() => document.getElementById("apply")?.scrollIntoView({ behavior: "smooth" })} />
      <HowItWorks />
      <Benefits />
      <section aria-labelledby="apply-h" className="mx-auto max-w-[1100px] px-4 py-16 md:px-10">
        <h2 id="apply-h" className="mb-8 text-center font-display text-[40px] font-extrabold leading-tight tracking-tight md:text-[56px]">
          {t("applyStart")} <span className="relative inline-block">{t("applyAccent")}<Squiggle className="absolute -bottom-1 left-0 h-3 w-full text-saffron" /></span>
        </h2>
        <Wizard />
      </section>
      <Faq />
    </div>
  );
}
