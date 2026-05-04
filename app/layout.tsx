import type { Metadata, Viewport } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { NavProgress } from "@/components/nav/NavProgress";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NJIT Fencing Alumni Memories",
  description:
    "An archive of stories from NJIT fencing alumni. Meets, training, road trips, coaches, teammates.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ViewTransitions>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full antialiased`}
      >
        <head>
          {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
            <>
              <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="" />
              <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
            </>
          ) : null}
        </head>
        <body className="flex min-h-svh flex-col">
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ViewTransitions>
  );
}
