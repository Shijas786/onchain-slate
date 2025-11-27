import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Onchain Slate",
  description: "Draw and mint your artwork as NFTs on Base",
  openGraph: {
    title: "Onchain Slate",
    description: "Draw and mint your artwork as NFTs on Base",
    type: "website",
    url: "https://onchain-slate.vercel.app",
    images: [
      {
        url: "https://onchain-slate.vercel.app/icon.png",
        width: 1200,
        height: 630,
        alt: "Onchain Slate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Onchain Slate",
    description: "Draw and mint your artwork as NFTs on Base",
    images: ["https://onchain-slate.vercel.app/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersObj = await headers();
  const cookies = headersObj.get('cookie');

  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  );
}
