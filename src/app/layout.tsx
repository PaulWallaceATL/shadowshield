import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import SessionProvider from "@/components/providers/SessionProvider";
import Script from "next/script";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shadow Shield",
  description: "Secure Enterprise LLM Gateway",
  icons: {
    icon: '/favicon.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <Script
          src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://unpkg.com/@heroicons/react@2.0.18/outline/esm/index.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased min-h-full bg-[#1a1a1a]">
        <SessionProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
