import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Central Lanches | Caixa e gestão",
  description: "Vendas, cardápio e gastos da Central Lanches.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
