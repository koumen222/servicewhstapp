import Link from "next/link";
import { MessageSquare, Shield, Zap, Globe, CheckCircle2, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#0f0f0f]">
      {/* Header / Navbar */}
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
          <Link className="hover:text-white transition-colors" href="/pricing">Tarifs</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link 
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2" 
            href="/login"
          >
            Connexion
          </Link>
          <Link 
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-500 transition-all shadow-lg shadow-green-900/20" 
            href="/register"
          >
            Essai Gratuit
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-600 rounded-full blur-[128px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-[128px]" />
          </div>
          
          <div className="container px-6 mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-900/30 border border-green-700/50 text-green-400 text-xs font-semibold mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Solution WhatsApp Business Professionnelle
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1]">
              Propulsez votre communication <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                sur WhatsApp
              </span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-zinc-400 text-lg md:text-xl mb-12 leading-relaxed">
              La plateforme complète pour automatiser votre relation client, gérer vos équipes et booster vos ventes en toute simplicité.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-green-500 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-green-900/30" 
                href="/register"
              >
                Démarrer gratuitement
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2" 
                href="/login"
              >
                Voir la démo
              </Link>
            </div>

            <div className="mt-16 flex items-center justify-center gap-8 grayscale opacity-50 text-sm font-medium text-zinc-500">
              <span>UTILISÉ PAR DES CENTAINES D'ENTREPRISES</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-zinc-950">
          <div className="container px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Puissant, Simple, Sécurisé</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Tout ce dont vous avez besoin pour automatiser vos processus métier sur WhatsApp.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Zap,
                  title: "Gestion Multi-comptes",
                  desc: "Connectez et gérez plusieurs numéros WhatsApp depuis une interface unique et centralisée."
                },
                {
                  icon: Globe,
                  title: "API de pointe",
                  desc: "Intégrez facilement WhatsApp à votre écosystème logiciel grâce à notre API robuste et documentée."
                },
                {
                  icon: Shield,
                  title: "Isolation Totale",
                  desc: "Sécurité de niveau entreprise avec une isolation complète des données entre vos différentes instances."
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Generic Solution Section */}
        <section id="solutions" className="py-24 border-t border-white/5">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1">
                <div className="w-12 h-1 bg-green-600 mb-8" />
                <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                  Optimisez votre <br /> Support et vos Ventes
                </h2>
                <ul className="space-y-4 mb-10">
                  {[
                    "Automatisation des réponses récurrentes",
                    "Notifications transactionnelles en temps réel",
                    "Gestion d'équipe et de conversations",
                    "Rapports détaillés d'activité"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-zinc-300">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link 
                  className="inline-flex items-center gap-2 text-green-500 font-bold hover:underline" 
                  href="/register"
                >
                  Découvrir tous les avantages <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex-1 relative">
                <div className="bg-gradient-to-tr from-green-600 to-emerald-400 p-1 rounded-3xl shadow-2xl shadow-green-500/20">
                  <div className="bg-zinc-900 rounded-[calc(1.5rem-1px)] p-6 aspect-video flex items-center justify-center overflow-hidden">
                    <div className="w-full space-y-4 animate-pulse">
                      <div className="h-8 bg-white/10 rounded-lg w-3/4" />
                      <div className="h-8 bg-white/5 rounded-lg w-1/2" />
                      <div className="h-24 bg-green-600/10 rounded-lg w-full" />
                      <div className="h-8 bg-white/10 rounded-lg w-2/3" />
                    </div>
                  </div>
                </div>
                {/* Float badge */}
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">API</div>
                  <div>
                    <div className="text-[10px] text-zinc-500 font-medium">Statut Service</div>
                    <div className="text-xs text-black font-bold">Opérationnel</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-24 bg-green-600">
          <div className="container px-6 mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Prêt à passer à la vitesse supérieure ?</h2>
            <p className="text-green-100 text-xl mb-10 max-w-xl mx-auto">Rejoignez les entreprises qui font confiance à notre expertise.</p>
            <Link 
              className="bg-white text-green-600 px-10 py-5 rounded-2xl text-xl font-extrabold hover:bg-zinc-100 transition-all shadow-2xl" 
              href="/register"
            >
              Créer mon compte
            </Link>
            <p className="mt-6 text-green-200 text-sm italic">Installation rapide en moins de 2 minutes.</p>
          </div>
        </section>
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
