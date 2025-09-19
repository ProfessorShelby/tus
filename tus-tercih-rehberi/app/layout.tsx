import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AdSenseScript } from "@/components/AdSenseScript";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TUS Tercih Rehberi - Tıpta Uzmanlık Sınavı Rehberi",
  description: "TUS sonuçlarını inceleyin, hastane ve branş bazında taban puanları görün, tercihlerinizi planlayın.",
  keywords: "TUS, tıpta uzmanlık, sınav, tercih, hastane, branş, taban puan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdSenseScript />
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
