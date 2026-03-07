import Link from "next/link";
import Image from "next/image";

export function PublicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
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

        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-7">
          <Link
            href="/#features"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Fonctionnalités
          </Link>
          <Link
            href="/#problems"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Solutions
          </Link>
          <Link
            href="/#integration"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Intégrations
          </Link>
          <Link
            href="/pricing"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Tarifs
          </Link>
          <Link
            href="/docs"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Documentation
          </Link>
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="bg-green-600 hover:bg-green-500 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Commencer — c'est gratuit
          </Link>
        </div>
      </div>
    </header>
  );
}
