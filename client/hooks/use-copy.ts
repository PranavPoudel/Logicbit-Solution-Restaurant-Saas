// hooks/use-copy.ts
"use client";

import { useState } from "react";

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };
  return { copied, copy };
}
