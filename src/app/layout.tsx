import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: { default: "AconselhA · Aconselhamento psicológico acessível", template: "%s · AconselhA" },
  description:
    "Converse com psicólogos de verdade, por um preço justo. Escolha o tema, responda algumas perguntas e agende seu atendimento online.",
};

export const viewport: Viewport = { themeColor: "#2f7a72" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
