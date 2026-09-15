// components/home/cuisine-selector.tsx
"use client";

import { useEffect, useState } from "react";
import { theme } from "@/config/theme";

interface Cuisine {
  id: string;
  name: string;
  icon?: string;
}

export function CuisineSelector({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/discovery/cuisines")
      .then((res) => res.json())
      .then((data) => {
        setCuisines(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="flex gap-2 px-4 py-3 text-sm" style={{ color: `${theme.colors.dark}66` }}>Loading cuisines…</div>;
  }

  if (error) {
    return <div className="flex gap-2 px-4 py-3 text-sm" style={{ color: theme.colors.primary }}>Couldn't load cuisines.</div>;
  }

  if (cuisines.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onSelect(null)}
        className="shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-colors"
        style={{
          backgroundColor: activeId === null ? theme.colors.primary : "transparent",
          color: activeId === null ? theme.colors.background : theme.colors.dark,
          borderColor: activeId === null ? theme.colors.primary : `${theme.colors.dark}22`,
        }}
      >
        All
      </button>
      {cuisines.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="shrink-0 text-sm font-medium px-4 py-2 rounded-full border transition-colors"
          style={{
            backgroundColor: activeId === c.id ? theme.colors.primary : "transparent",
            color: activeId === c.id ? theme.colors.background : theme.colors.dark,
            borderColor: activeId === c.id ? theme.colors.primary : `${theme.colors.dark}22`,
          }}
        >
          {c.icon ? `${c.icon} ` : ""}{c.name}
        </button>
      ))}
    </div>
  );
}