import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "GARIMO: boas descobertas, bons preços",
    template: "%s | GARIMO",
  },
  description:
    "A GARIMO seleciona produtos e ofertas da Shopee para ajudar você a encontrar boas oportunidades de compra.",
  applicationName: "GARIMO",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "GARIMO",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
