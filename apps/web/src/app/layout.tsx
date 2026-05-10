import React from "react";
import type { Metadata } from "next";
import { Poppins, Inter, Instrument_Sans, Public_Sans } from "next/font/google";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import RootProviders from "@/components/providers";
import { TopLoader } from "@/components/top-loader";
import { Analytics } from "@vercel/analytics/next";
import { generateTitle, generateDescription } from "@/lib/seo";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontPoppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = Inter({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const fontInstrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const fontPublicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const BASE_URL = "https://opend2c.com";
const OG_IMAGE = `${BASE_URL}/og.png`;
const DESCRIPTION = generateDescription(
  "Open D2C is a free marketplace for Indian direct-to-consumer brands. List your brand, reach new customers, and grow.",
);

export const metadata: Metadata = {
  title: generateTitle("Open D2C"),
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/icon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/icon-light.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.svg",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
  openGraph: {
    title: generateTitle("Open D2C"),
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Open D2C — Free marketplace for Indian D2C brands" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: generateTitle("Open D2C"),
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <meta name="p:domain_verify" content="263c83126f8d79bccabc00711d8d80c6" />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontPoppins.variable,
          fontMono.variable,
          fontInstrumentSans.variable,
          fontPublicSans.variable,
        )}
      >
        <TopLoader />
        <Analytics />
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
