import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MY OWN SHOP — Rent, Lease or Buy Commercial Shops",
  description:
    "MY OWN SHOP is a marketplace for commercial shops only. Search shops to rent, lease, or buy directly from owners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <AuthProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <ChatWidget />
            </ConfirmDialogProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
