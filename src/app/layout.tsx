import type { Metadata } from "next";
import "./globals.css";
import AppNav from "@/components/layout/app-nav";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "ReadWise AI",
  description: "智能英语阅读训练平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col pb-16">
        {children}
        <AppNav />
        <Analytics />
      </body>
    </html>
  );
}
