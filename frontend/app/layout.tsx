import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | ZeChat.site",
    default: "ZeChat.site — Vendez plus via WhatsApp, automatiquement et en masse",
  },
  description:
    "ZeChat.site : l'outil WhatsApp des e-commerçants. Diffusion ciblée, agent IA, médias riches. Boost vos ventes en Afrique.",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
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
