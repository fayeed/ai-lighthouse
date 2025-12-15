import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AI Lighthouse - Website AI Readiness Analyzer",
  description: "Analyze your website's AI readiness and optimize it for AI systems like ChatGPT, search engines, and voice assistants. Get comprehensive reports on content quality, extractability, and AI comprehension.",
  keywords: ["AI readiness", "website analyzer", "SEO", "ChatGPT optimization", "AI comprehension", "content analysis", "website audit"],
  authors: [{ name: "Fayeed Pawaskar", url: "https://fayeed.dev" }],
  creator: "Fayeed Pawaskar",
  publisher: "Fayeed Pawaskar",
  openGraph: {
    title: "AI Lighthouse - Website AI Readiness Analyzer",
    description: "Analyze and optimize your website for AI systems. Get instant insights on how ChatGPT and other AI tools understand your content.",
    url: "https://ai-lighthouse.com",
    siteName: "AI Lighthouse",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AI Lighthouse - Website AI Readiness Analyzer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Lighthouse - Website AI Readiness Analyzer",
    description: "Analyze and optimize your website for AI systems like ChatGPT, search engines, and voice assistants.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1e40af" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
