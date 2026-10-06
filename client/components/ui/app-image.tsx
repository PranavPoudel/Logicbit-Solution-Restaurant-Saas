import Image from "next/image";
import type { ComponentProps } from "react";
import { API_ORIGIN } from "@/lib/api-config";
import { getFullImageUrl } from "@/lib/utils/image";

const OPTIMIZED_HOSTS = new Set<string>([safeHost(API_ORIGIN), "images.unsplash.com"]);

function safeHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "";
  }
}

function shouldSkipOptimizer(src: string): boolean {
  if (src.startsWith("data:") || src.startsWith("blob:")) return true;
  if (/\.svg($|\?)/i.test(src)) return true;
  if (/^(https?:)?\/\//.test(src)) {
    try {
      return !OPTIMIZED_HOSTS.has(new URL(src, "http://x").host);
    } catch {
      return true;
    }
  }
  return false;
}

type AppImageProps = Omit<ComponentProps<typeof Image>, "src" | "alt" | "width" | "height" | "fill"> & {
  src: string | null | undefined;
  alt: string;
};

export function AppImage({ src, alt, sizes = "100vw", ...rest }: AppImageProps) {
  const resolved = getFullImageUrl(src);
  if (!resolved) return null;
  return (
    <Image
      src={resolved}
      alt={alt}
      width={0}
      height={0}
      sizes={sizes}
      unoptimized={shouldSkipOptimizer(resolved)}
      {...rest}
    />
  );
}
