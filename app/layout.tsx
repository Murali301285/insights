import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/layout/AppShell";
import { HeaderProvider } from "@/components/providers/HeaderProvider";
import { FilterProvider } from "@/components/providers/FilterProvider";
import { DetailViewProvider } from "@/components/providers/DetailViewProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InsideCode | Insight Dashboard",
  description: "B2B SaaS Analytics Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body
        className={cn(
          geistSans.variable,
          geistMono.variable,
          "antialiased min-h-screen bg-zinc-50 font-sans text-zinc-900"
        )}
      >
        <FilterProvider>
          <HeaderProvider>
            <DetailViewProvider>
              <AppShell>
                {children}
              </AppShell>
            </DetailViewProvider>
          </HeaderProvider>
          <Toaster />
        </FilterProvider>
      </body>
    </html>
  );
}
