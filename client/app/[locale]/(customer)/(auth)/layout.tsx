// app/(customer)/(auth)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { theme } from "@/config/theme";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth");
  const mode = usePathname().endsWith("/signup") ? "signup" : "login";

  return (
    <AuthShell
      mode={mode}
      footer={
        mode === "login" ? (
          <>
            {t("newTo", { brand: theme.brand.name })}{" "}
            <Link href="/signup" className="inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4">
              {t("createLink")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")}{" "}
            <Link href="/login" className="inline-flex min-h-11 items-center font-bold text-chili underline underline-offset-4">
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
