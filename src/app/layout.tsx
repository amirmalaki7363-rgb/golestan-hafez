import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "استودیو گل گلستان حافظ - Golestane Hafez | سفارش آنلاین گل در تهران",
  description:
    "استودیو گل گلستان حافظ — سفارش آنلاین دسته‌گل و باکس گل با ارسال در تهران و اصفهان.",
  keywords: [
    "گلستان حافظ",
    "Golestane Hafez",
    "فروشگاه آنلاین گل",
    "سفارش دسته گل",
    "باکس گل",
    "گل تهران",
  ],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Fonts are self-hosted (src/app/fonts.css + public/fonts) so the
            first paint never waits on an external font CDN. */}
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
