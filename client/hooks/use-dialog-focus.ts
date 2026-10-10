import { useEffect, useRef } from "react";

const FOCUSABLE = "button:not([disabled]), [href], input, select, textarea";

export function useDialogFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const trapTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = node.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!node.contains(active) || (e.shiftKey && active === first)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapTab);

    return () => {
      document.removeEventListener("keydown", trapTab);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, []);

  return ref;
}
