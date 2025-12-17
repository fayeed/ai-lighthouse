import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollToTop from "@/components/ScrollToTop";
import { Analytics } from "@/components/Analytics";
import ErrorBoundary from "@/components/ErrorBoundary";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ai-lighthouse.com";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "AI Lighthouse - Website AI Readiness Analyzer",
  description: "Analyze your website's AI readiness and optimize it for AI systems like ChatGPT, search engines, and voice assistants. Get comprehensive reports on content quality, extractability, and AI comprehension.",
  keywords: ["AI readiness", "website analyzer", "SEO", "ChatGPT optimization", "AI comprehension", "content analysis", "website audit"],
  authors: [{ name: "Fayeed Pawaskar", url: "https://fayeed.dev" }],
  creator: "Fayeed Pawaskar",
  publisher: "Fayeed Pawaskar",
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    title: "AI Lighthouse - Website AI Readiness Analyzer",
    description: "Analyze and optimize your website for AI systems. Get instant insights on how ChatGPT and other AI tools understand your content.",
    url: baseUrl,
    siteName: "AI Lighthouse",
    type: "website",
    images: [
      {
        url: `${baseUrl}/android-chrome-512x512.png`,
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
    images: [`${baseUrl}/android-chrome-512x512.png`],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'AI Lighthouse',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Any',
              description:
                "Analyze your website's AI readiness and optimize it for AI systems, search engines, and voice assistants.",
              url: baseUrl,
              publisher: {
                '@type': 'Organization',
                name: 'AI Lighthouse',
                url: baseUrl,
              },
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          {children}
          <ScrollToTop />
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
