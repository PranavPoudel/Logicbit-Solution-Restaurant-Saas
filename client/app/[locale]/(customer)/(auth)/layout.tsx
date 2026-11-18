// app/(customer)/(auth)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { AuthShell } from "@/components/auth/auth-shell";

// Pages that sit in the same shell but are neither the login nor the sign-up tab.
const FLOW_PAGES = ["verify-email", "forgot-password", "reset-password"] as const;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");
  const pathname = usePathname();
  const mode = pathname.endsWith("/signup") ? "signup" : "login";
  const flow = FLOW_PAGES.find((page) => pathname.endsWith(`/${page}`));

  const linkClass = "inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4";

  return (
    <AuthShell
      mode={mode}
      heading={flow ? { title: t(`flow.${flow}.title`), accent: t(`flow.${flow}.accent`), sub: t(`flow.${flow}.sub`) } : undefined}
      footer={
        flow ? (
          <Link href="/login" className={linkClass}>
            {t("backToLogin")}
          </Link>
        ) : mode === "login" ? (
          <>
            {t("newTo", { brand: theme.brand.name })}{" "}
            <Link href="/signup" className={linkClass}>
              {t("createLink")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className={linkClass}>
              {t("logIn")}
            </Link>
          </>
        )
      }
    >
      {children}
    </AuthShell>
  );
}
