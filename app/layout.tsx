import type { Metadata } from "next";
import "./globals.css";

const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.VERCEL_PROJECT_PRODUCTION_URL ||
  process.env.VERCEL_URL;
const siteUrl = configuredSiteUrl
  ? configuredSiteUrl.startsWith("http")
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`
  : "http://localhost:3000";

const title = "乐乐 AI 篮球战术板";
const description = "乐乐的本地篮球战术板：默认摆放 A 队五人，按需拖入 B 队与篮球，绘制并连续播放战术。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "乐乐 AI 篮球战术板" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
