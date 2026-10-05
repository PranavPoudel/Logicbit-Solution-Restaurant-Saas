import type { CuisineLike } from "@/types/restaurant";

export function cuisineList(cuisines: CuisineLike[] | undefined): { key: string; name: string }[] {
  return (cuisines ?? [])
    .map((c) =>
      typeof c === "string"
        ? { key: c, name: c }
        : { key: c.id || c.slug || c.name || "", name: c.name || c.slug || "" }
    )
    .filter((c) => c.name);
}
