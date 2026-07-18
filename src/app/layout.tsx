import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RequestWidget from "@/components/RequestWidget";
import { AuthProvider } from "@/context/AuthContext";
import { RequestWidgetProvider } from "@/context/RequestWidgetContext";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HADA Aesthetic Training",
  description:
    "Clinical training curriculum for aesthetic medicine practitioners and students — injectables, devices, anatomy, and safety.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <AuthProvider>
          <RequestWidgetProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <RequestWidget />
          </RequestWidgetProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
