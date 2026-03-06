import Link from "next/link";
import { CheckCircle2, MessageSquare, ArrowRight, Zap, Star, CreditCard, Building2 } from "lucide-react";

export default function PricingPage() {
  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "0 XAF",
      description: "Pour tester et débuter gratuitement.",
      features: [
        "1 instance WhatsApp",
        "500 messages/mois",
        "Accès API REST",
        "Support communauté",
      ],
      cta: "Commencer gratuitement",
      highlighted: false,
      color: "#5a7a5a",
      icon: Zap,
    },
    {
      id: "starter",
      name: "Starter",
      price: "15 000 XAF",
      originalPrice: "30 000 XAF",
      discount: "-50%",
      description: "Idéal pour les petites entreprises.",
      features: [
        "1 instance WhatsApp",
        "100,000 messages/mois",
        "Webhooks",
        "Support email",
      ],
      cta: "Choisir Starter",
      highlighted: true,
      color: "#22c55e",
      icon: Star,
    },
    {
      id: "pro",
      name: "Pro",
      price: "45 000 XAF",
      originalPrice: "90 000 XAF",
      discount: "-50%",
      description: "Pour les entreprises en pleine croissance.",
      features: [
        "5 instances WhatsApp",
        "1,000,000 messages/mois",
        "Support prioritaire",
        "Analytiques avancées",
      ],
      cta: "Choisir Pro",
      highlighted: false,
      color: "#3b82f6",
      icon: CreditCard,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "150 000 XAF",
      originalPrice: "300 000 XAF",
      discount: "-50%",
      description: "Solution sur mesure pour grands comptes.",
      features: [
        "10 instances WhatsApp",
        "Messages illimités",
        "Support dédié",
        "Intégrations sur mesure",
      ],
      cta: "Contactez-nous",
      highlighted: false,
      color: "#8b5cf6",
      icon: Building2,
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {tiers.map((tier, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col ${
                  tier.highlighted 
                    ? "bg-[#0d2010] border-[#22c55e50] shadow-2xl shadow-green-500/10 scale-105 relative z-10" 
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#22c55e] text-black text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    PLUS POPULAIRE
                  </div>
                )}
                
                <div className="mb-6">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${tier.color}18` }}
                  >
                    <tier.icon size={18} style={{ color: tier.color }} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  
                  <div className="flex flex-col gap-0.5">
                    {tier.originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 line-through">{tier.originalPrice}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{tier.discount}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-white" style={{ color: tier.highlighted ? '#22c55e' : 'white' }}>
                        {tier.price}
                      </span>
                      {tier.id !== 'free' && <span className="text-zinc-500 text-xs">/mois</span>}
                    </div>
                  </div>
                  <p className="mt-3 text-zinc-400 text-xs leading-relaxed">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-zinc-300 text-xs">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  href="/register"
                  className={`w-full py-3 rounded-xl text-center text-sm font-bold transition-all ${
                    tier.highlighted || tier.id === 'free'
                      ? "bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  style={tier.highlighted ? { backgroundColor: tier.color } : {}}
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
