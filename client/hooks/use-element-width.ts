import { useCallback, useState } from "react";

export function useElementWidth() {
  const [width, setWidth] = useState(0);

  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
