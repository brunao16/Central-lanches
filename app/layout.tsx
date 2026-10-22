import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Lanches | Gestão e PDV",
  description: "Sistema profissional de caixa, cardápio digital, cozinha e delivery.",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#e8192c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
