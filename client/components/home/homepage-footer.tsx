// components/home/homepage-footer.tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { Icon } from "@/components/ui/primitives";

export function CustomerFooter() {
  const t = useTranslations();
  const columns: [string, [string, string][]][] = [
    [t("footer.eat"), [[t("header.restaurants"), "/restaurants"], [t("header.myOrders"), "/account?tab=orders"], [t("footer.search"), "/search"]]],
    [theme.brand.name, [[t("header.forRestaurants"), "/for-restaurants"], [t("footer.privacy"), "/privacy"], [t("footer.terms"), "/terms"]]],
  ];

  return (
    <footer className="relative mt-auto overflow-hidden bg-footer px-5 pt-16 text-cream md:px-10 dark:text-ink">
      <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-4xl font-bold leading-tight">
            {t("footer.stillScrolling")}
            <br />
            <span className="text-saffron">{t("footer.stomach")}</span>
          </p>
          <Link href="/restaurants" className="mt-6 inline-flex h-14 items-center gap-2 rounded-full bg-chili px-8 font-display text-lg font-extrabold text-parchment transition hover:-translate-y-0.5 hover:bg-parchment hover:text-espresso active:translate-y-0">
            {t("footer.orderNow")}
            <Icon name="arrow" className="h-5 w-5" />
          </Link>
        </div>
        {columns.map(([heading, links]) => (
          <div key={heading}>
            <p className="font-bold text-saffron">{heading}</p>
            <ul className="mt-1">
              {links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center hover:text-saffron">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="font-display mx-auto mt-12 max-w-[1440px] select-none text-[24vw] font-extrabold leading-[0.75] tracking-[-0.06em] text-chili md:text-[300px]" aria-hidden>
        {theme.brand.name}
      </p>
      <p className="relative mx-auto max-w-[1440px] py-6 text-xs text-cream/70 dark:text-ink/70">
        © {new Date().getFullYear()} {theme.brand.name} ·{" "}
        <a href={`mailto:${theme.content.contactEmail}`} className="-my-3 inline-block py-3 hover:text-saffron hover:underline">{theme.content.contactEmail}</a> ·{" "}
        <a href={`tel:${theme.content.contactPhone.replace(/[^\d+]/g, "")}`} className="-my-3 inline-block py-3 hover:text-saffron hover:underline">{theme.content.contactPhone}</a>
      </p>
    </footer>
  );
}
