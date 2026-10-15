// components/account/pager.tsx
"use client";

interface PagerProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

const BUTTON =
  "min-h-10 rounded-full border border-[#E8E7E2] bg-white px-4 text-sm font-medium text-neutral-600 transition-colors duration-200 hover:border-neutral-300 disabled:opacity-40 disabled:hover:border-[#E8E7E2]";

export function Pager({ page, pageCount, onChange }: PagerProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between pt-2">
      <button type="button" className={BUTTON} disabled={page === 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="text-sm text-neutral-500">
        Page {page} of {pageCount}
      </span>
      <button type="button" className={BUTTON} disabled={page === pageCount} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}
