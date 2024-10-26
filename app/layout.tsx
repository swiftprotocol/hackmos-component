"use client";

import { Inter } from "next/font/google";
import { GrazProvider, WalletType } from "graz";
import { cosmoshub } from "graz/chains";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-black`}>
        <GrazProvider
          grazOptions={{
            chains: [cosmoshub],
            defaultWallet: WalletType.KEPLR,
            autoReconnect: false,
          }}
        >
          {children}
        </GrazProvider>
      </body>
    </html>
  );
}
