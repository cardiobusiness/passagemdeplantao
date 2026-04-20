import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Passagem de Plantao",
  description: "Gestao Inteligente de CTI"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
