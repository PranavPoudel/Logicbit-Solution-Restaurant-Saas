// components/chatbot/chat-widget.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/primitives";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useChatbot, type ChatMessage } from "@/hooks/use-chatbot";
import { renderChatText } from "@/lib/utils/chat-text";

export function ChatWidget() {
  const t = useTranslations("chatbot");
  const [open, setOpen] = useState(false);
  const { messages, typing, send, endChat, canEnd, ended, takenOver, restaurant, askName, visitorName, setVisitorName, quickReplies } = useChatbot(open);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => input.current?.focus(), 300);
    return () => clearTimeout(id);
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(draft);
    setDraft("");
  };

  const action = (m: ChatMessage) => {
    if (!m.href) return null;
    const cls = "mt-2 inline-flex min-h-9 items-center gap-1.5 font-bold text-crimson hover:underline";
    const label = <>{t(`action.${m.action}`)}<Icon name="arrow" className="h-4 w-4" /></>;
    return m.href.startsWith("tel:") ? (
      <a href={m.href} className={cls}>{label}</a>
    ) : (
      <Link href={m.href} onClick={() => setOpen(false)} className={cls}>{label}</Link>
    );
  };

  const lastIsBot = messages[messages.length - 1]?.from === "bot";

  return (
    <>
      <section
        role="dialog"
        aria-label={t("title")}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-3 bottom-24 z-40 flex h-[min(560px,calc(100dvh-7.5rem))] origin-bottom-right flex-col overflow-hidden rounded-[28px] border-2 border-ink/10 bg-cream shadow-warm transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-auto sm:right-6 sm:w-[390px] ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-4 scale-90 opacity-0"}`}
      >
        <header className="flex items-center gap-3 bg-crimson px-5 py-4 text-cream">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-crimson"><Icon name="bowl" className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <h2 className="font-display text-xl font-extrabold">{t("title")}</h2>
            <p className="flex items-center gap-1.5 truncate text-sm text-cream/85">
              <span className="h-2 w-2 shrink-0 rounded-full bg-herb" />
              <span className="truncate">{takenOver ? t("humanStatus") : restaurant ? t("asking", { name: restaurant.name }) : t("status")}</span>
            </p>
          </div>
          {canEnd && !ended && (
            <button type="button" onClick={() => setConfirmEnd(true)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-bold hover:bg-cream/15">{t("end")}</button>
          )}
          <button type="button" onClick={() => setOpen(false)} aria-label={t("close")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-cream/15">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </header>

        <div ref={log} role="log" aria-live="polite" className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {messages.map((m) => {
            const human = m.from === "owner" || m.from === "admin";
            // user + owner/admin text is shown as plain text; only bot text may use **bold** / links.
            const body = m.from === "bot" ? renderChatText(m.text ?? t(`reply.${m.key}`, m.values)) : m.text;
            return (
              <div key={m.id} className={`animate-fade-up flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-snug ${m.from === "user" ? "rounded-br-md bg-crimson text-cream" : human ? "rounded-bl-md border-2 border-crimson/30 bg-paper text-ink" : "shadow-soft rounded-bl-md bg-paper text-ink"}`}>
                  {human && <p className="mb-1 text-xs font-bold text-crimson">{t(m.from === "admin" ? "admin" : "owner")}</p>}
                  <p className="whitespace-pre-line break-words">{body}</p>
                  {action(m)}
                </div>
              </div>
            );
          })}
          {typing && (
            <div className="animate-fade-up flex justify-start" aria-label={t("typing")}>
              <div className="shadow-soft flex gap-1.5 rounded-2xl rounded-bl-md bg-paper px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="dot-bounce h-2 w-2 rounded-full bg-ink/40" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          {askName && (
            <label className="animate-fade-up block text-sm font-medium text-ink/75">
              {t("nameLabel", { name: restaurant?.name ?? "" })}
              <input value={visitorName} onChange={(e) => setVisitorName(e.target.value)} maxLength={40} placeholder={t("namePlaceholder")} className="mt-1.5 min-h-11 w-full rounded-2xl border-2 border-ink/15 bg-paper px-4 text-base text-ink outline-none placeholder:text-ink/50 focus:border-ink" />
            </label>
          )}
          {lastIsBot && !typing && (
            <div className="flex flex-wrap gap-2 pt-1">
              {quickReplies.map((q, i) => (
                <button key={q.id} type="button" onClick={() => void send(t(`suggest.${q.id}`), q.id)} style={{ animationDelay: `${i * 70}ms` }} className="animate-fade-up inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-crimson/40 bg-paper px-4 font-bold text-crimson hover:border-crimson hover:bg-crimson hover:text-cream">
                  <Icon name={q.icon} className="h-4 w-4" />{t(`suggest.${q.id}`)}
                </button>
              ))}
            </div>
          )}
        </div>

        {confirmEnd && (
          <div className="animate-fade-up flex items-center justify-between gap-3 border-t-2 border-ink/10 bg-paper px-4 py-3">
            <p className="font-medium">{t("endConfirm")}</p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => setConfirmEnd(false)} className="min-h-11 rounded-full border-2 border-ink/15 px-4 font-bold hover:bg-ink/5">{t("keep")}</button>
              <button type="button" onClick={() => { endChat(); setConfirmEnd(false); }} className="min-h-11 rounded-full bg-crimson px-4 font-bold text-cream hover:bg-ink">{t("end")}</button>
            </div>
          </div>
        )}

        {ended ? (
          <div className="flex items-center justify-between gap-3 border-t-2 border-ink/10 bg-paper px-4 py-3">
            <p className="font-medium">{t("endedNote")}</p>
            <button type="button" onClick={finish} className="min-h-11 shrink-0 rounded-full bg-crimson px-4 font-bold text-cream hover:bg-ink">{t("newChat")}</button>
          </div>
        ) : (
        <form onSubmit={submit} className="border-t-2 border-ink/10 bg-paper p-3">
          <div className="flex items-center gap-2 rounded-full border-2 border-ink/15 bg-cream p-1.5 pl-4 focus-within:border-ink">
            <label htmlFor="chat-input" className="sr-only">{t("placeholder")}</label>
            <input ref={input} id="chat-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={300} placeholder={t("placeholder")} autoComplete="off" className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink/60" />
            <button type="submit" disabled={!draft.trim() || typing} aria-label={t("send")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-crimson text-cream hover:bg-ink disabled:opacity-40">
              <Icon name="send" className="h-5 w-5" />
            </button>
          </div>
        </form>
        )}
      </section>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? t("close") : t("open")}
        className="shadow-hard fixed bottom-5 right-5 z-40 flex h-14 items-center gap-2 rounded-full bg-crimson pl-4 pr-4 font-display text-lg font-extrabold text-cream hover:-translate-y-0.5 hover:bg-ink sm:right-6 sm:pr-5"
      >
        <span className="relative h-6 w-6">
          <Icon name="chat" className={`absolute inset-0 h-6 w-6 transition-all duration-300 motion-reduce:transition-none ${open ? "rotate-90 scale-0 opacity-0" : "scale-100 opacity-100"}`} />
          <Icon name="x" className={`absolute inset-0 h-6 w-6 transition-all duration-300 motion-reduce:transition-none ${open ? "scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
        </span>
        <span className="hidden sm:inline">{open ? t("close") : t("launcher")}</span>
      </button>
    </>
  );
}
