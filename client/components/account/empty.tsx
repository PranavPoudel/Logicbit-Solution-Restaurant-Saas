// components/account/empty.tsx
import type { ReactNode } from "react";

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className="rounded-[24px] border-2 border-dashed border-ink/20 px-6 py-10 text-center text-lg text-ink/75">{children}</p>
);
