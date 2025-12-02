import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = "https://onchain-slate.vercel.app";

export const metadata: Metadata = {
  title: "OnchainSlate – Mint NFTs",
  description: "Turn your sketches into NFTs in seconds.",
  openGraph: {
    title: "OnchainSlate – Mint NFTs",
    description: "Turn your sketches into NFTs in seconds.",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: `${siteUrl}/social.png`,
        width: 1200,
        height: 630,
        alt: "OnchainSlate",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnchainSlate – Mint NFTs",
    description: "Turn your sketches into NFTs in seconds.",
    images: [`${siteUrl}/social.png`],
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
