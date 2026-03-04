import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | WhatsApp SaaS",
    default: "WhatsApp SaaS — Instance Manager",
  },
  description:
    "Professional WhatsApp multi-tenant instance management platform",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-[#0f0f0f] text-[#f0f0f0]">
        {children}
      </body>
    </html>
  );
}
