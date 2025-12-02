import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ClientLayout } from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Ved Hub",
  description: "A modern social platform for students",
  keywords: ["campus", "college", "community", "events", "students"],
  authors: [{ name: "Ved Hub" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Campus Connect",
    title: "Campus Connect",
    description:
      "A premium college community platform for events, social networking, and collaboration.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Connect",
    description:
      "A premium college community platform for events, social networking, and collaboration.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
