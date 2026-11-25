import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import AppShell from "@/components/AppShell";

const inter = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 900",
});

const plusJakartaSans = localFont({
  src: "../../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "200 800",
});

const jetbrainsMono = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-mono",
  display: "swap",
  weight: "100 800",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.edworld.co.in"),
  title: {
    default: "EdWorld Co. — Career & Skills Platform",
    template: "%s — EdWorld Co.",
  },
  description:
    "EdWorld Co. is a student-focused education, networking, career readiness and opportunities platform for learners from 9th grade to B.Tech/M.Tech, researchers, and professionals.",
  keywords: [
    "EdWorld Co",
    "EdWorld",
    "Career Readiness",
    "ATS Resume Maker",
    "Interactive Mock Interviews",
    "Student Network",
    "Job Board",
    "Skill Calibration",
    "Interview Practice",
    "Project Studio",
  ],
  authors: [{ name: "EdWorld Co. Team", url: "https://www.edworld.co.in" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EdWorld Co",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.edworld.co.in",
    siteName: "EdWorld Co.",
    title: "EdWorld Co. — Career & Skills Platform",
    description:
      "Student-focused education, networking, ATS Resume Maker, and Adaptive Mock Interviews.",
    images: [
      {
        url: "/images/edworld-logo.png",
        width: 800,
        height: 800,
        alt: "EdWorld Co. Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EdWorld Co. — Career & Skills Platform",
    description: "Adaptive mock interviews, ATS resume optimization, and curated opportunities for students.",
    images: ["/images/edworld-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} scroll-smooth font-sans`}>
      <body className="min-h-screen flex flex-col bg-white text-black antialiased selection:bg-[#2563EB] selection:text-white">
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
