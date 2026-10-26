// app/(customer)/not-found.tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button, Icon, Squiggle } from "@/components/ui/primitives";


export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-12 md:px-10 md:py-20 lg:grid-cols-2">
      <div>
        <p className="inline-flex -rotate-2 items-center gap-2 rounded-full bg-ink px-4 py-2 font-bold text-cream">
          <Icon name="alert" className="h-5 w-5" />{t("badge")}
        </p>
        <h1 className="mt-6 font-display text-[56px] font-extrabold leading-[0.92] tracking-tight md:text-[88px]">
          {t("titleStart")}{" "}
          <span className="relative inline-block text-chili">
            {t("titleAccent")}<Squiggle className="absolute -bottom-2 left-0 h-4 w-full text-saffron md:-bottom-3 md:h-6" />
          </span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-ink/80">{t("body")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/"><Button size="lg">{t("home")}<Icon name="arrow" className="h-5 w-5" /></Button></Link>
          <Link href="/restaurants"><Button size="lg" variant="outline">{t("browse")}</Button></Link>
        </div>
      </div>

      <div className="relative h-[320px] overflow-hidden rounded-[36px] bg-saffron md:h-[440px]" aria-hidden>
        <div className="blob absolute -left-16 -top-16 h-64 w-64 bg-chili" />
        <div className="blob shadow-warm absolute -right-10 top-10 h-[260px] w-[260px] overflow-hidden border-8 border-cream md:h-[340px] md:w-[340px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/cuisine-chinese.jpg.avif" alt="" className="h-full w-full scale-110 object-cover" />
        </div>
        <span className="absolute bottom-8 left-8 -rotate-6 rounded-2xl bg-paper px-5 py-3 font-display text-5xl font-extrabold shadow-hard md:text-7xl">404</span>
      </div>
    </section>
  );
}
