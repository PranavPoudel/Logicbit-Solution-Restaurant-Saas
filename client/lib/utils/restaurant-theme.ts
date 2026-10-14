import type { CSSProperties } from "react";

const DEFAULT_PRIMARY = "#e3a008";
const DEFAULT_SECONDARY = "#17181c";
const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getRestaurantThemeStyle(colors?: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}): CSSProperties {
  const primary = colors?.primaryColor?.toLowerCase();
  const secondary = colors?.secondaryColor?.toLowerCase();
  const style: Record<string, string> = {};

  if (primary && HEX.test(primary) && primary !== DEFAULT_PRIMARY) {
    style["--brand-primary"] = primary;
    style["--brand-primary-hover"] = `color-mix(in srgb, ${primary} 82%, black)`;
    style["--brand-on-primary"] = luminance(primary) > 0.45 ? "#17181C" : "#FDF6EC";
  }
  if (secondary && HEX.test(secondary) && secondary !== DEFAULT_SECONDARY && luminance(secondary) < 0.2) {
    style["--brand-dark"] = secondary;
    style["--brand-dark-hover"] = `color-mix(in srgb, ${secondary} 85%, white)`;
  }

  return style as CSSProperties;
}
