import Link from "next/link";
import { CheckCircle2, MessageSquare, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      name: "Starter",
      price: "29€",
      description: "Parfait pour les petites entreprises qui débutent.",
      features: [
        "1 Instance WhatsApp",
        "Messages illimités",
        "API Standard",
        "Support par email",
        "Tableau de bord basique",
      ],
      cta: "Commencer l'essai",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "79€",
      description: "La solution complète pour les entreprises en croissance.",
      features: [
        "5 Instances WhatsApp",
        "Messages illimités",
        "API Prioritaire",
        "Support 24/7",
        "Statistiques avancées",
        "Gestion d'équipe",
      ],
      cta: "Choisir Pro",
      highlighted: true,
    },
    {
      name: "Business",
      price: "199€",
      description: "Puissance maximale pour les grandes structures.",
      features: [
        "Instances illimitées",
        "Messages illimités",
        "API Dédiée",
        "Gestionnaire de compte",
        "Webhooks personnalisés",
        "SLA 99.9%",
      ],
      cta: "Contacter la vente",
      highlighted: false,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="px-6 h-20 flex items-center justify-between border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="/">
          <div className="w-8 h-8 relative flex items-center justify-center transition-transform group-hover:scale-105">
            <img 
              src="/logo.png" 
              alt="ZeChat Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            ZeChat<span className="text-green-500 text-xl tracking-tighter">.site</span>
          </span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-zinc-400">
          <Link className="hover:text-white transition-colors" href="/#features">Fonctionnalités</Link>
          <Link className="hover:text-white transition-colors" href="/#solutions">Solutions</Link>
          <Link className="text-white transition-colors" href="/pricing">Tarifs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link href="/register" className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-500 transition-all shadow-lg shadow-green-900/20">
            Essai Gratuit
          </Link>
        </div>
      </header>

      <main className="flex-1 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">Des tarifs simples et transparents</h1>
            <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
              Choisissez le forfait qui correspond le mieux à vos besoins. Pas de frais cachés.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {tiers.map((tier, i) => (
              <div 
                key={i} 
                className={`p-8 rounded-3xl border ${
                  tier.highlighted 
                    ? "bg-white/10 border-green-500 shadow-2xl shadow-green-500/10 scale-105 relative z-10" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                } transition-all duration-300 flex flex-col`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    PLUS POPULAIRE
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                    <span className="text-zinc-500">/mois</span>
                  </div>
                  <p className="mt-4 text-zinc-400 text-sm">{tier.description}</p>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-zinc-300 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/register"
                  className={`w-full py-4 rounded-xl text-center font-bold transition-all ${
                    tier.highlighted
                      ? "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-20 text-center p-12 rounded-3xl bg-green-900/20 border border-green-700/30 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Besoin d'une solution sur mesure ?</h2>
            <p className="text-zinc-400 mb-8">
              Nous proposons des solutions personnalisées pour les besoins spécifiques des grandes entreprises.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 text-green-500 font-bold hover:underline text-lg"
            >
              Contactez notre équipe commerciale <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-white/5 bg-black">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 relative flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="ZeChat Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-base font-bold text-white tracking-tighter italic">ZeChat.site</span>
          </div>
          <div className="text-zinc-500 text-sm">
            © 2026 ZeChat — Expert en automatisation WhatsApp.
          </div>
          <div className="flex gap-6">
            <Link className="text-zinc-500 hover:text-white transition-colors" href="#">CGU</Link>
            <Link className="text-zinc-500 hover:text-white transition-colors" href="#">Confidentialité</Link>
            <Link className="text-zinc-500 hover:text-white transition-colors" href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
