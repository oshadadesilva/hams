import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import TopNav from "@/components/TopNav";
import { ToastProvider } from "@/components/ToastProvider";
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
  title: "HAMS | Healthcare Appointment Management System",
  description:
    "Manage doctor availability and book patient appointments with Next.js, Node.js, MongoDB, and Mongoose.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ToastProvider>
          <TopNav />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
