import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Sanyen",
    default: "Sanyen — Gestionnaire d'instances WhatsApp en Afrique",
  },
  description:
    "Plateforme professionnelle de gestion d'instances WhatsApp multi-comptes pour les entreprises africaines.",
  icons: {
    icon: "/favicon.ico",
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
