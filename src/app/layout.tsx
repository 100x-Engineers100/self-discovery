"use client";

import "./globals.css";
import { SessionProvider } from "next-auth/react";
import AuthGuard from "@/components/auth-guard";
import { SidebarProvider } from "@/components/ui/sidebar";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

const cooperBlack = localFont({
  src: "../font/CooperLtBT-Regular.ttf",
  variable: "--font-cooper-black",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cooperBlack.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SessionProvider>
          <AuthGuard>
            <SidebarProvider>
            {children}
            </SidebarProvider>
            </AuthGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
