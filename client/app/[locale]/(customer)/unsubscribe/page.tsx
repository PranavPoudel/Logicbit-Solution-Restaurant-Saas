"use client";

import { use } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button, Icon } from "@/components/ui/primitives";
import { unsubscribeApi, type UnsubscribeStatus } from "@/lib/api/unsubscribe";

export default function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = use(searchParams);
  const t = useTranslations("unsubscribe");
  const queryClient = useQueryClient();
  const key = ["email-unsubscribe", token];

  const status = useQuery({ queryKey: key, queryFn: () => unsubscribeApi.status(token), enabled: !!token, retry: false });
  const change = useMutation({
    mutationFn: (unsubscribe: boolean) => (unsubscribe ? unsubscribeApi.unsubscribe(token) : unsubscribeApi.resubscribe(token)),
    onSuccess: (data: UnsubscribeStatus) => queryClient.setQueryData(key, data),
  });

  const data = status.data;
  const invalid = !token || status.isError;
  const name = data?.restaurantName ?? "";

  const shell = (icon: string, title: string, body: string, actions: React.ReactNode) => (
    <section className="mx-auto w-full max-w-[640px] px-5 py-16 md:py-24">
      <div className="shadow-soft rounded-[32px] bg-paper p-8 md:p-10">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--accent,var(--brand-chili))]/10 text-[var(--accent,var(--brand-chili))]"><Icon name={icon} className="h-7 w-7" /></span>
        <h1 className="mt-5 font-display text-[32px] font-extrabold leading-tight tracking-tight md:text-[40px]">{title}</h1>
        <p className="mt-3 text-lg text-ink/80">{body}</p>
        {change.isError && <p role="alert" className="mt-4 rounded-2xl border-2 border-dashed border-chili/50 bg-chili/5 px-4 py-3 font-bold text-chili">{t("failed")}</p>}
        <div className="mt-8 flex flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  );

  if (invalid) {
    return shell("alert", t("invalidTitle"), t("invalidBody"), <Link href="/restaurants"><Button size="lg">{t("browse")}</Button></Link>);
  }

  if (!data) {
    return (
      <section className="mx-auto w-full max-w-[640px] px-5 py-16 md:py-24" aria-busy="true">
        <div className="h-72 animate-pulse rounded-[32px] bg-ink/10" />
      </section>
    );
  }

  if (data.unsubscribed) {
    return shell(
      "check",
      t("doneTitle"),
      t("doneBody", { restaurant: name }),
      <Button size="lg" variant="outline" disabled={change.isPending} onClick={() => change.mutate(false)}>{t("undo")}</Button>,
    );
  }

  return shell(
    "mail",
    change.isSuccess ? t("backAgainTitle") : t("askTitle", { restaurant: name }),
    change.isSuccess ? t("backAgainBody", { restaurant: name }) : t("askBody", { restaurant: name }),
    change.isSuccess ? (
      <Link href="/restaurants"><Button size="lg">{t("browse")}</Button></Link>
    ) : (
      <>
        <Button size="lg" disabled={change.isPending} onClick={() => change.mutate(true)}>{t("confirm")}</Button>
        <Link href="/restaurants"><Button size="lg" variant="outline">{t("keep")}</Button></Link>
      </>
    ),
  );
}
