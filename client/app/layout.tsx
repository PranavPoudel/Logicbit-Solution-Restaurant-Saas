import type { Metadata } from "next";
import { Geist, Space_Grotesk, JetBrains_Mono, Bricolage_Grotesque, DM_Sans, Noto_Sans_JP } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { themeCssVariables } from "@/config/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LogicBit",
  description: "Order food from restaurants near you.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      style={themeCssVariables}
      className={`${geistSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${bricolage.variable} ${dmSans.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {/* QueryProvider now wraps EVERYTHING, including Owner Dashboard */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}