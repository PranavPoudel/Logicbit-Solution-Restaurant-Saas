"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/primitives";

interface SortMenuProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SortMenu<T extends string>({ label, value, options, onChange }: SortMenuProps<T>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selected = Math.max(options.findIndex((o) => o.value === value), 0);

  const openMenu = () => {
    setActive(selected);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const pick = (i: number) => {
    onChange(options[i].value);
    close();
  };

  useEffect(() => {
    if (open) list.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onListKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Tab") return setOpen(false);
    const last = options.length - 1;
    if (e.key === "ArrowDown") setActive((i) => (i === last ? 0 : i + 1));
    else if (e.key === "ArrowUp") setActive((i) => (i === 0 ? last : i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(last);
    else if (e.key === "Enter" || e.key === " ") pick(active);
    else if (e.key === "Escape") close();
    else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            openMenu();
          }
        }}
        className="shadow-soft flex min-h-11 items-center gap-2 rounded-full bg-paper pl-4 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ink"
      >
        <span className="text-ink/70">{label}</span>
        <span className="font-bold text-ink">{options[selected].label}</span>
        <Icon name="chevron" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKeyDown}
          className="animate-fade-up shadow-warm absolute right-0 top-full z-30 mt-2 w-max min-w-full rounded-[24px] bg-paper p-2 outline-none"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selected}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(i)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-6 rounded-full px-4 transition-colors motion-reduce:transition-none ${i === active ? "bg-ink/10" : ""} ${i === selected ? "font-bold" : "font-medium"}`}
            >
              {o.label}
              {i === selected && <Icon name="check" className="h-4 w-4 text-chili" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
