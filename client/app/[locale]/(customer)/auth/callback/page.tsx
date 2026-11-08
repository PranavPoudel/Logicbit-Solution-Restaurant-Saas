// app/(customer)/auth/callback/page.tsx — where Google sends the customer back to
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Icon } from "@/components/ui/primitives";
import { customerGoogleExchange } from "@/lib/api/customer-auth";
import { authErrorInfo } from "@/lib/utils/auth-error";
import { takeGoogleNext } from "@/lib/utils/google-login";
import { useCustomerAuthStore } from "@/store/customer-auth-store";

const KNOWN_ERRORS = ["provider_not_configured", "access_denied", "invalid_state", "no_email", "email_unverified", "account_disabled", "login_failed"];

export default function GoogleCallbackPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const setAuth = useCustomerAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // The single-use code can only be redeemed once, so never run this twice (React strict mode runs effects twice in development).
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("code");
    const failure = params.get("error");
    // Take the code out of the address bar and history straight away.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    const finish = async () => {
      if (failure || !code) return setError(failure ?? "invalid_state");
      try {
        setAuth(await customerGoogleExchange(code));
        router.replace(takeGoogleNext());
      } catch (err) {
        setError(authErrorInfo(err).code ?? "login_failed");
      }
    };
    void finish();
  }, [router, setAuth]);

  const errorKey = error && KNOWN_ERRORS.includes(error) ? error : "login_failed";

  return (
    <section className="mx-auto w-full max-w-[640px] px-5 py-16 md:py-24">
      <div className="shadow-soft rounded-[32px] bg-paper p-8 text-center md:p-10" role={error ? "alert" : "status"} aria-busy={!error}>
        {error ? (
          <>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-chili/10 text-chili"><Icon name="alert" className="h-7 w-7" /></span>
            <p className="mt-5 text-lg text-ink/80">{t(`social.errors.${errorKey}`)}</p>
            <div className="mt-8">
              <Link href="/login"><Button size="lg">{t("social.tryAgain")}</Button></Link>
            </div>
          </>
        ) : (
          <>
            <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-[3px] border-ink/20 border-t-chili" />
            <p className="mt-5 text-lg text-ink/80">{t("social.signingIn")}</p>
          </>
        )}
      </div>
    </section>
  );
}
