"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group shrink-0">
          <div className="w-8 h-8 relative flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
              className="object-contain group-hover:opacity-90 transition-opacity"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          <Link href="/#features" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Fonctionnalités</Link>
          <Link href="/#problems" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Solutions</Link>
          <Link href="/#integration" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Intégrations</Link>
          <Link href="/pricing" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Tarifs</Link>
          <Link href="/docs" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Documentation</Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors">Connexion</Link>
          <Link href="/register" className="bg-green-600 hover:bg-green-500 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
            Commencer — c'est gratuit
          </Link>
        </div>

        {/* Mobile right: login + hamburger */}
        <div className="flex lg:hidden items-center gap-2">
          <Link href="/login" className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors px-2">Connexion</Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/5 bg-black/95 backdrop-blur-xl">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {[
              { href: "/#features", label: "Fonctionnalités" },
              { href: "/#problems", label: "Solutions" },
              { href: "/#integration", label: "Intégrations" },
              { href: "/pricing", label: "Tarifs" },
              { href: "/docs", label: "Documentation" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="text-[14px] font-medium text-zinc-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 mt-2 border-t border-white/5">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="block w-full text-center bg-green-600 hover:bg-green-500 text-white text-[14px] font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                Commencer — c'est gratuit
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
