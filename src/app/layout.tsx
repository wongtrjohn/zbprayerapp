import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/context/AuthContext";
import { PrayerProvider } from "@/context/PrayerContext";
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
  title: "ZBPrayerApp — Pray for Our Church, Our People, Our World",
  description:
    "A prayer app for Zion Bishan. Light a candle as you pray through the weekly bulletin's prayer points across Our Church, Our People, and Our World.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <AuthProvider>
          <PrayerProvider>
            <Navigation />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-400 dark:border-slate-800">
              ZBPrayerApp — Every prayer lights a candle 🕯️
            </footer>
          </PrayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
