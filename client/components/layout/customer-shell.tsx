// components/layout/customer-shell.tsx
"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

const KEY = "logicbit-theme";
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const getSnapshot = () => localStorage.getItem(KEY) === "dark";
const getServerSnapshot = () => false;

const ThemeCtx = createContext<{ dark: boolean; setDark: (value: boolean) => void }>({ dark: false, setDark: () => {} });
export const useCustomerTheme = () => useContext(ThemeCtx);

export function CustomerShell({ children }: { children: ReactNode }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setDark = (value: boolean) => {
    localStorage.setItem(KEY, value ? "dark" : "light");
    listeners.forEach((cb) => cb());
  };

  return (
    <ThemeCtx.Provider value={{ dark, setDark }}>
      <div className={`customer flex min-h-screen flex-col overflow-x-clip ${dark ? "dark" : ""}`}>{children}</div>
    </ThemeCtx.Provider>
  );
}
