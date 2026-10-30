import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s | Painel GARIMO" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#fbfaf8]">{children}</div>;
}
