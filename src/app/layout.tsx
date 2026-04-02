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
    default: "StorePilot — AI Agents for Shopify Automation",
    template: "%s | StorePilot",
  },
  description:
    "StorePilot connects 3 AI agents to your Shopify store — recovering abandoned carts via WhatsApp and voice, and scanning inventory daily.",
  keywords: [
    "AI ecommerce",
    "inventory optimization",
    "whatsapp cart recovery",
    "voice AI sales",
    "shopify automation",
    "shopify agent",
    "AI agents India",
  ],
  authors: [{ name: "StorePilot" }],
  openGraph: {
    title: "StorePilot — AI Agents for Shopify Automation",
    description:
      "3 AI agents that recover abandoned carts, optimize inventory, and close deals — all connected to your Shopify store.",
    url: "https://storepilot.vercel.app",
    siteName: "StorePilot",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StorePilot — AI Agents for Shopify Automation",
    description:
      "3 AI agents that recover abandoned carts, optimize inventory, and close deals — all connected to your Shopify store.",
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
