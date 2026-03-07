import Link from "next/link";
import { CheckCircle2, ArrowRight, Zap, Star, CreditCard, Building2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function PricingPage() {
  const tiers = [
    {
      id: "free",
      name: "Free",
      price: "Gratuit",
      description: "Pour tester et débuter gratuitement.",
      features: [
        "1 instance WhatsApp",
        "500 messages/mois",
        "Accès API REST",
        "Support communauté",
      ],
      cta: "Plan actuel",
      highlighted: false,
      color: "#5a7a5a",
      icon: Zap,
    },
    {
      id: "starter",
      name: "Starter",
      price: "2 495 XAF",
      originalPrice: "4 990 XAF",
      discount: "-50%",
      description: "Idéal pour les petites entreprises.",
      features: [
        "1 instance WhatsApp",
        "100,000 messages/mois",
        "Webhooks",
        "Support email",
      ],
      cta: "Choisir ce plan",
      highlighted: true,
      color: "#22c55e",
      icon: Star,
    },
    {
      id: "pro",
      name: "Pro",
      price: "7 495 XAF",
      originalPrice: "14 990 XAF",
      discount: "-50%",
      description: "Pour les entreprises en pleine croissance.",
      features: [
        "5 instances WhatsApp",
        "1,000,000 messages/mois",
        "Support prioritaire",
        "Analytiques avancées",
      ],
      cta: "Choisir ce plan",
      highlighted: false,
      color: "#3b82f6",
      icon: CreditCard,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "24 995 XAF",
      originalPrice: "49 990 XAF",
      discount: "-50%",
      description: "Solution sur mesure pour grands comptes.",
      features: [
        "10 instances WhatsApp",
        "Messages illimités",
        "Support dédié",
        "Intégrations sur mesure",
      ],
      cta: "Choisir ce plan",
      highlighted: false,
      color: "#8b5cf6",
      icon: Building2,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <PublicHeader />

      <main className="flex-1 pt-16">
        <div className="max-w-6xl mx-auto px-8 py-20">
          <div className="text-center mb-14">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Des tarifs simples et transparents</h1>
            <p className="text-zinc-400 text-base max-w-xl mx-auto">
              Choisissez le forfait qui correspond à vos besoins. Aucun frais caché.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tiers.map((tier, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl border transition-all duration-200 flex flex-col ${
                  tier.highlighted 
                    ? "bg-zinc-900 border-green-500/40 shadow-lg shadow-green-500/10 relative" 
                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
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
                  <h3 className="text-base font-semibold text-white mb-1">{tier.name}</h3>
                  
                  <div className="flex flex-col gap-0.5">
                    {tier.originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 line-through">{tier.originalPrice}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{tier.discount}</span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold" style={{ color: tier.highlighted ? '#22c55e' : 'white' }}>
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
                  className={`w-full py-2.5 rounded-lg text-center text-sm font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-green-600 text-white hover:bg-green-500"
                      : tier.id === 'free'
                      ? "bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                      : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-16 p-10 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
            <h2 className="text-xl font-semibold text-white mb-3">Besoin d'une solution sur mesure ?</h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-lg mx-auto">
              Nous proposons des solutions personnalisées pour les besoins spécifiques des grandes entreprises.
            </p>
            <Link 
              href="/contact" 
              className="inline-flex items-center gap-2 text-green-500 text-sm font-semibold hover:text-green-400 transition-colors"
            >
              Contacter notre équipe <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-8 py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ZeChat.site" className="w-7 h-7 object-contain" />
            <span className="text-[15px] font-bold text-white tracking-tight">
              ZeChat<span className="text-green-500">.site</span>
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            © 2026 ZeChat.site. Tous droits réservés.
          </p>
          <div className="flex gap-5">
            <Link className="text-sm text-zinc-500 hover:text-white transition-colors" href="#">CGU</Link>
            <Link className="text-sm text-zinc-500 hover:text-white transition-colors" href="#">Confidentialité</Link>
            <Link className="text-sm text-zinc-500 hover:text-white transition-colors" href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
