import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | ZeChat",
    default: "ZeChat — Gestionnaire d'instances WhatsApp en Afrique",
  },
  description:
    "Plateforme professionnelle ZeChat de gestion d'instances WhatsApp multi-comptes.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f0f] text-[#f0f0f0]">
        {children}
      </body>
    </html>
  );
}
