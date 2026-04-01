import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Revmo — AI Agents That Sell For You",
    template: "%s | Revmo",
  },
  description:
    "Revmo is the AI-powered ecommerce platform with Inventory Optimizer, WhatsApp Nudge, and Voice Closer agents that automate your D2C store's growth.",
  keywords: [
    "AI ecommerce",
    "inventory optimization",
    "whatsapp marketing",
    "voice AI sales",
    "D2C automation",
    "shopify agent",
    "woocommerce AI",
  ],
  authors: [{ name: "Revmo" }],
  openGraph: {
    title: "Revmo — AI Agents That Sell For You",
    description:
      "3 specialized AI agents that optimize inventory, nudge customers on WhatsApp, and close deals by voice.",
    url: "https://revmo.ai",
    siteName: "Revmo",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revmo — AI Agents That Sell For You",
    description:
      "3 specialized AI agents that optimize inventory, nudge customers on WhatsApp, and close deals by voice.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <PostHogProvider>
          <div className="bg-mesh" />
          {children}
          <Toaster theme="dark" richColors closeButton position="bottom-right" />
        </PostHogProvider>
      </body>
    </html>
  );
}
