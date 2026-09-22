import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZGATRI WORK — 个人工作台",
  description: "销售、库存、待办与新媒体运营集中管理。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
