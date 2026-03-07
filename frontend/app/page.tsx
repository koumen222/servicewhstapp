"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle2, 
  ArrowRight,
  BarChart3,
  Lock,
  Workflow,
  Clock,
  Users,
  TrendingUp,
  Code2,
  Sparkles,
  ChevronDown,
  MessageSquare,
  Wifi,
  Activity,
  Send,
  Key,
  Webhook,
  PlugZap,
  AlertCircle,
  Plus
} from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] bg-grid-green">
      <PublicHeader />

      <main className="flex-1 pt-16">

        {/* ─── 1. HERO ─────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-0 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-green-500/15 rounded-full blur-[120px]" />
          </div>

          <div className="max-w-6xl mx-auto px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400 tracking-wide">Outil de vente WhatsApp pour e-commerçants</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[60px] font-bold text-white mb-5 leading-[1.1] tracking-tight max-w-4xl mx-auto">
              Vendez plus via WhatsApp,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                automatiquement et en masse
              </span>
            </h1>
            <p className="text-base text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed">
              Envoyez vos promotions à des centaines de clients ciblés par ville ou produit, laissez votre agent IA gérer les réponses, et boostez vos ventes sans effort supplémentaire.
            </p>

            <div className="flex items-center justify-center gap-3 mb-14">
              <Link href="/register" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Démarrer gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                Voir les tarifs
              </Link>
            </div>

            {/* Dashboard mockup */}
            <div className="relative mx-auto max-w-5xl">
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
                {/* Mockup top bar */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  <div className="flex-1 mx-4">
                    <div className="h-5 bg-zinc-800 rounded-md w-48 mx-auto flex items-center justify-center">
                      <span className="text-[10px] text-zinc-500">dashboard.zechat.site</span>
                    </div>
                  </div>
                </div>
                {/* Mockup content */}
                <div className="flex" style={{ height: 340 }}>
                  {/* Sidebar */}
                  <div className="w-14 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-4 gap-4 shrink-0">
                    <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                    </div>
                    {[Wifi, BarChart3, Code2, Users, Shield].map((Icon, i) => (
                      <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-zinc-800' : ''}`}>
                        <Icon className="h-3.5 w-3.5 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                  {/* Main area */}
                  <div className="flex-1 p-5 overflow-hidden">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-white text-sm font-semibold mb-0.5">Bonjour, bienvenue</div>
                        <div className="text-zinc-500 text-xs">Votre tableau de bord e-commerce</div>
                      </div>
                      <div className="bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-green-600/30 hover:scale-105">
                        <Plus className="h-3 w-3" /> Nouvelle diffusion
                      </div>
                    </div>
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mb-5">
                      {[
                        { label: "Clients contactés", val: "1,842", color: "text-green-400" },
                        { label: "Messages envoyés", val: "12,490", color: "text-white" },
                        { label: "Taux de réponse", val: "68%", color: "text-emerald-400" },
                        { label: "Ventes générées", val: "347 k XAF", color: "text-yellow-400" },
                      ].map((s, i) => (
                        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-850 hover:scale-105 hover:shadow-lg group">
                          <div className={`text-lg font-bold ${s.color} mb-0.5 transition-transform group-hover:scale-110`}>{s.val}</div>
                          <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Instance list */}
                    <div className="space-y-2">
                      {[
                        { name: "Promo Chaussures Yaoundé", num: "342 clients · photos produit", status: "Envoyé", dot: "bg-green-500" },
                        { name: "Soldes Douala Nord", num: "215 clients · vidéo + prix", status: "En cours", dot: "bg-blue-500" },
                        { name: "Relance paniers abandonnés", num: "98 clients · message IA", status: "Planifié", dot: "bg-yellow-500" },
                      ].map((inst, i) => (
                        <div key={i} className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 cursor-pointer transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-850 hover:scale-[1.02] group">
                          <div className={`w-2 h-2 rounded-full ${inst.dot} shrink-0 ${inst.dot === 'bg-blue-500' ? 'animate-pulse' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white group-hover:text-green-400 transition-colors">{inst.name}</div>
                            <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{inst.num}</div>
                          </div>
                          <div className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-all ${inst.dot === 'bg-green-500' ? 'bg-green-500/10 text-green-400 group-hover:bg-green-500/20' : inst.dot === 'bg-blue-500' ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 group-hover:bg-yellow-500/20'}`}>{inst.status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right panel */}
                  <div className="w-56 border-l border-zinc-800 p-4 shrink-0 hidden xl:block">
                    <div className="text-xs font-semibold text-zinc-400 mb-3">Activité récente</div>
                    <div className="space-y-2.5">
                      {[
                        { icon: Send, label: "342 messages envoyés", sub: "Chaussures Yaoundé", color: "text-green-400" },
                        { icon: MessageSquare, label: "Réponse IA : client", sub: "Commande confirmée", color: "text-blue-400" },
                        { icon: Activity, label: "Photo reçue par 215", sub: "Soldes Douala Nord", color: "text-purple-400" },
                        { icon: TrendingUp, label: "12 nouvelles ventes", sub: "via WhatsApp", color: "text-yellow-400" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2.5 cursor-pointer transition-all duration-200 hover:translate-x-1 group">
                          <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-zinc-750 transition-colors">
                            <item.icon className={`h-3 w-3 ${item.color} transition-transform group-hover:scale-110`} />
                          </div>
                          <div>
                            <div className="text-[11px] text-zinc-300 font-medium group-hover:text-white transition-colors">{item.label}</div>
                            <div className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors">{item.sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Glow under screenshot */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-green-500/20 blur-3xl rounded-full -z-10" />
            </div>
          </div>
        </section>

        {/* ─── 2. PAIN POINTS ────────────────────────── */}
        <section id="problems" className="pt-28 pb-20 bg-black">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex items-end justify-between mb-12">
              <div className="max-w-xl">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">Le défi</p>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Ce qui freine vos ventes<br />WhatsApp aujourd'hui
                </h2>
              </div>
              <Link href="/#features" className="hidden md:flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors shrink-0 mb-1">
                Notre solution <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Pain card 1 */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="p-5 pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">1</div>
                    <h3 className="text-sm font-semibold text-white">Envoi manuel, client par client</h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Vous passez des heures à envoyer les mêmes photos produits et promotions un par un à chaque client. C'est lent, épuisant et non scalable.</p>
                  {/* Mini mockup */}
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 overflow-hidden">
                    <div className="space-y-2">
                      {[
                        { name: "Konan A.", time: "2 min ago" },
                        { name: "Brice M.", time: "5 min ago" },
                        { name: "Diane K.", time: "8 min ago" },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] text-zinc-400 font-bold shrink-0">{c.name[0]}</div>
                          <span className="text-[10px] text-zinc-500 flex-1">{c.name} — envoi manuel</span>
                          <span className="text-[9px] text-zinc-600">{c.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-medium text-green-500">Envoi groupé à des centaines en 1 clic</div>
                </div>
              </div>

              {/* Pain card 2 */}
              <div className="rounded-2xl border border-green-500/30 bg-zinc-950 overflow-hidden shadow-lg shadow-green-500/5">
                <div className="p-5 pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400">2</div>
                    <h3 className="text-sm font-semibold text-white">Aucune segmentation clientèle</h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Vous envoyez le même message à tout le monde sans cibler par ville, par produit intérêt ou historique d'achat. Résultat : faible taux de conversion.</p>
                  {/* Mini mockup */}
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Filtre ville</span>
                        <span className="text-[10px] text-red-400">non actif</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Filtre produit</span>
                        <span className="text-[10px] text-red-400">non actif</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500">Segment acheteurs</span>
                        <span className="text-[10px] text-red-400">non actif</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-medium text-green-500">Ciblage précis par ville, produit, profil</div>
                </div>
              </div>

              {/* Pain card 3 */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden hover:border-zinc-700 transition-colors">
                <div className="p-5 pb-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">3</div>
                    <h3 className="text-sm font-semibold text-white">Réponses tardives = ventes perdues</h3>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-4">Un client qui ne reçoit pas de réponse dans les 5 minutes achète ailleurs. Vous ne pouvez pas répondre à tous en même temps manuellement.</p>
                  {/* Mini mockup */}
                  <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0 mt-0.5" />
                        <div className="bg-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] text-zinc-400">Le prix du sac svp ?</div>
                      </div>
                      <div className="flex items-start gap-2 justify-end">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-1.5 text-[10px] text-red-400">Pas de réponse... 3h plus tard</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs font-medium text-green-500">Agent IA qui répond instantanément 24/7</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 3. FEATURE CARDS WITH MOCKUPS ───────────────────────── */}
        <section id="features" className="py-20 bg-zinc-950/50">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">Fonctionnalités</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Tout ce qu'il vous faut pour vendre via WhatsApp
              </h2>
              <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                Une plateforme taille pour les e-commerçants sérieux : diffusion en masse, ciblage précis, IA intégrée et médias riches.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 — Diffusion ciblée */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
                <div className="bg-zinc-900 border-b border-zinc-800 p-5">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium mb-3">Nouvelle diffusion · Filtre actif</div>
                  <div className="space-y-2 mb-3">
                    {[
                      { label: "Ville", val: "Yaoundé, Douala" },
                      { label: "Produit", val: "Chaussures femme" },
                      { label: "Clients cibles", val: "342 contacts" },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-zinc-500">{f.label}</span>
                        <span className="text-[10px] text-green-400 font-medium">{f.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-zinc-400">IMG</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-300">Promo chaussures -30% — photo.jpg</div>
                      <div className="text-[9px] text-zinc-600">Prêt à envoyer à 342 clients</div>
                    </div>
                    <div className="text-[9px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded shrink-0">Envoyer</div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Send className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Diffusion ciblée en masse</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed flex-1">Envoyez photos, vidéos, messages vocaux et promotions à des centaines de clients filtrés par ville, produit ou historique d'achat.</p>
                  <Link href="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-green-500 hover:text-green-400 transition-colors">
                    Démarrer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 2 — Agent IA */}
              <div className="rounded-2xl border border-green-500/20 bg-zinc-950 overflow-hidden flex flex-col shadow-lg shadow-green-500/5">
                <div className="bg-zinc-900 border-b border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-green-400" />
                    </div>
                    <span className="text-[10px] text-green-400 font-medium">Agent IA · en ligne</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0 mt-0.5" />
                      <div className="bg-zinc-800 rounded-xl rounded-tl-sm px-3 py-2 text-[10px] text-zinc-300">C'est combien la robe rouge ?</div>
                    </div>
                    <div className="flex items-start gap-2 justify-end">
                      <div className="bg-green-600/20 border border-green-500/20 rounded-xl rounded-tr-sm px-3 py-2 text-[10px] text-green-300">La robe rouge est à 12 500 XAF. Livraison disponible à Douala et Yaoundé. Vous voulez commander ?</div>
                      <div className="w-5 h-5 rounded-full bg-green-600/20 shrink-0 mt-0.5 flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-green-400" />
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-700 shrink-0 mt-0.5" />
                      <div className="bg-zinc-800 rounded-xl rounded-tl-sm px-3 py-2 text-[10px] text-zinc-300">Oui, taille M svp</div>
                    </div>
                    <div className="flex items-start gap-2 justify-end">
                      <div className="bg-green-600/20 border border-green-500/20 rounded-xl rounded-tr-sm px-3 py-2 text-[10px] text-green-300">Parfait ! Je note votre commande. Quel est votre adresse de livraison ?</div>
                      <div className="w-5 h-5 rounded-full bg-green-600/20 shrink-0 mt-0.5 flex items-center justify-center">
                        <Sparkles className="h-2.5 w-2.5 text-green-400" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Agent IA qui vend à votre place</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed flex-1">Configurez votre agent IA avec vos produits, prix et politiques. Il répond aux clients 24h/24, gère les commandes et ne laisse jamais une question sans réponse.</p>
                  <Link href="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-green-500 hover:text-green-400 transition-colors">
                    Configurer mon agent <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Feature 3 — Médias riches */}
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden flex flex-col hover:border-zinc-700 transition-colors">
                <div className="bg-zinc-900 border-b border-zinc-800 p-5">
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-medium mb-3">Types de médias supportés</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: "\ud83d\uddbc\ufe0f", label: "Photos produits", color: "text-blue-300" },
                      { icon: "\ud83c\udfa5", label: "Vidéos produits", color: "text-purple-300" },
                      { icon: "\ud83c\udfa4", label: "Messages vocaux", color: "text-orange-300" },
                      { icon: "\ud83d\udcc4", label: "Catalogues PDF", color: "text-red-300" },
                      { icon: "\ud83d\udccd", label: "Localisation", color: "text-yellow-300" },
                      { icon: "\ud83d\udcde", label: "Contacts partagés", color: "text-green-300" },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-2.5 py-2">
                        <span className="text-sm">{m.icon}</span>
                        <span className={`text-[10px] font-medium ${m.color}`}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                    <Activity className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Médias riches à grande échelle</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed flex-1">Envoyez photos de produits, vidéos de présentation, bons de réduction en PDF et messages vocaux personnalisés à tous vos clients simultanément.</p>
                  <Link href="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-green-500 hover:text-green-400 transition-colors">
                    Démarrer <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 4. INTEGRATIONS ─────────────────────────────────────── */}
        <section id="integration" className="py-20 bg-black">
          <div className="max-w-6xl mx-auto px-8 text-center">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">Intégrations</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Connecte-toi à tes outils e-commerce</h2>
            <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-12">
              Synchronise ta boutique, importe ta liste clients et automatise tes envois directement depuis tes outils existants.
            </p>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 max-w-3xl mx-auto mb-10">
              {[
                { label: "Shopify", Icon: TrendingUp, color: "text-green-400" },
                { label: "WooCommerce", Icon: Globe, color: "text-blue-400" },
                { label: "Google Sheets", Icon: BarChart3, color: "text-emerald-400" },
                { label: "Zapier", Icon: Zap, color: "text-orange-400" },
                { label: "Make", Icon: PlugZap, color: "text-purple-400" },
                { label: "N8N", Icon: Workflow, color: "text-pink-400" },
                { label: "Webhooks", Icon: Webhook, color: "text-yellow-400" },
                { label: "REST API", Icon: Code2, color: "text-blue-300" },
                { label: "WhatsApp", Icon: MessageSquare, color: "text-green-400" },
                { label: "Analytiques", Icon: Activity, color: "text-cyan-400" },
                { label: "Sécurité", Icon: Lock, color: "text-zinc-400" },
                { label: "Support", Icon: Users, color: "text-indigo-400" },
              ].map(({ label, Icon, color }, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <Icon className={`h-6 w-6 ${color}`} strokeWidth={1.5} />
                  <span className="text-[10px] text-zinc-500 font-medium">{label}</span>
                </div>
              ))}
            </div>

            <Link href="/docs" className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
              Voir toutes les intégrations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ─── 5. FAQ ──────────────────────────────────────────────── */}
        <section className="py-20 bg-zinc-950/50">
          <div className="max-w-6xl mx-auto px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Left */}
              <div>
                <p className="text-xs font-semibold text-green-500 uppercase tracking-widest mb-3">FAQ</p>
                <h2 className="text-3xl font-bold text-white mb-4">Questions fréquentes</h2>
                <p className="text-sm text-zinc-400 mb-8">
                  Vous ne trouvez pas ce que vous cherchez ? Contactez notre équipe directement.
                </p>
                <Link href="/#contact" className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                  Nous contacter
                </Link>
              </div>

              {/* Right - Accordion */}
              <div className="space-y-2">
                {[
                  {
                    q: "Puis-je envoyer des photos de produits à plusieurs clients en même temps ?",
                    a: "Oui. La diffusion en masse vous permet d'envoyer photos, vidéos, PDF ou messages vocaux à des centaines de clients simultanément. Vous sélectionnez votre média, définissez votre segment (ville, produit...) et envoyez en un clic."
                  },
                  {
                    q: "Comment fonctionne l'agent IA ?",
                    a: "Vous configurez votre agent avec votre catalogue produits, vos prix, vos conditions de livraison et votre FAQ. L'IA répond automatiquement aux questions clients 24h/24, gère les commandes et transfre les cas complexes à un humain."
                  },
                  {
                    q: "Puis-je cibler mes clients par ville ou par produit ?",
                    a: "Absolument. Notre système de segmentation vous permet de filtrer vos contacts par ville, intérêt produit, historique d'achat ou tout autre critère. Vous êtes assuré d'envoyer le bon message à la bonne personne."
                  },
                  {
                    q: "Quel type de fichiers puis-je envoyer ?",
                    a: "Tous les types supportes par WhatsApp : images (JPG, PNG), vidéos (MP4), messages vocaux (OGG), documents PDF, fichiers ZIP, localisations GPS et contacts. Taille maximale : 100 Mo par fichier."
                  },
                  {
                    q: "Est-ce que ça fonctionne avec Shopify ou WooCommerce ?",
                    a: "Oui. Vous pouvez connecter votre boutique via notre API REST ou via Zapier/Make. Automatisez les notifications de commande, les confirmations de paiement et les relances panier abandonné."
                  },
                  {
                    q: "Comment se passe le paiement de l'abonnement ?",
                    a: "La facturation est mensuelle en XAF, réglée via WhatsApp directement. Lorsque vous choisissez un plan, vous êtes redirigé vers une conversation WhatsApp pour finaliser le paiement. Aucune carte bancaire requise."
                  },
                ].map((item, i) => (
                  <div key={i} className="border border-zinc-800 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-white">{item.q}</span>
                      <ChevronDown className={`h-4 w-4 text-zinc-500 shrink-0 ml-3 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <div className="px-5 pb-4 border-t border-zinc-800">
                        <p className="text-sm text-zinc-400 leading-relaxed pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FINAL CTA ────────────────────────────────────────── */}
        <section className="py-20 bg-black">
          <div className="max-w-6xl mx-auto px-8">
            <div className="rounded-2xl bg-gradient-to-br from-green-600/20 via-zinc-900 to-zinc-900 border border-green-500/20 p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Prêt à booster vos ventes via WhatsApp ?
              </h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
                Rejoignez des centaines d'e-commerçants qui utilisent ZeChat.site pour vendre plus, plus vite. Démarrez gratuitement.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link href="/register" className="bg-green-600 hover:bg-green-500 text-white px-7 py-3 rounded-lg text-sm font-semibold transition-colors">
                  Créer un compte gratuit
                </Link>
                <Link href="/pricing" className="border border-zinc-700 hover:border-zinc-600 text-white px-7 py-3 rounded-lg text-sm font-semibold transition-colors">
                  Voir les tarifs
                </Link>
              </div>
              <p className="mt-5 text-xs text-zinc-600">Aucune carte bancaire requise · Premières diffusions en 5 minutes</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-zinc-950 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <img src="/logo.png" alt="ZeChat.site" className="w-8 h-8 object-contain" />
                <span className="text-[17px] font-bold text-white tracking-tight">
                  ZeChat<span className="text-green-500">.site</span>
                </span>
              </Link>
              <p className="text-sm text-zinc-400 leading-relaxed">
                L'outil WhatsApp des e-commerçants ambitieux — vente, diffusion et IA en un seul endroit.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Produit</h3>
              <ul className="space-y-3">
                <li><Link href="/#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/#integration" className="text-sm text-zinc-400 hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Entreprise</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">À propos</Link></li>
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Légal</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Conditions d'utilisation</Link></li>
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-zinc-500">
              © 2026 ZeChat.site. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-zinc-500">Fait avec passion en Afrique</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
