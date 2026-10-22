import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Lanches | Caixa e gestão",
  description: "Vendas, cardápio e gastos da Central Lanches.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#e8192c" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d84416" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
