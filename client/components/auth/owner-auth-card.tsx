// components/auth/owner-auth-card.tsx — the dark page and white card the owner sign-in pages share
import type { ReactNode } from "react";
import { theme } from "@/config/theme";

export function OwnerAuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1B2333] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-[#1B2333] flex items-center justify-center">
            <span className="font-mono text-[#E3A008] text-sm font-bold">{theme.brand.name[0]}</span>
          </div>
          <span className="font-semibold text-[#1B2333] text-lg">{theme.brand.name}</span>
        </div>

        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

export function OwnerAuthError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

export function OwnerAuthNotice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
      {children}
    </p>
  );
}

export const ownerButtonClass = "w-full bg-[#1B2333] text-white text-sm font-medium py-2.5 rounded-xl disabled:opacity-60";
export const ownerLinkClass = "text-sm font-medium text-[#1B2333] underline underline-offset-4";
