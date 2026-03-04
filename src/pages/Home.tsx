import { Link } from 'react-router-dom'
import { MessageSquare, Zap, Shield, Globe, CheckCircle, ArrowRight, Users, Activity, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PLANS = [
  { key: 'free',       name: 'Free',       price: 0,     instances: 1,   color: 'border-border',         badge: '' },
  { key: 'starter',    name: 'Starter',    price: 4990,  instances: 3,   color: 'border-emerald-400',    badge: 'Populaire' },
  { key: 'pro',        name: 'Pro',        price: 14990, instances: 10,  color: 'border-blue-400',       badge: 'Recommandé' },
  { key: 'enterprise', name: 'Enterprise', price: 49990, instances: 100, color: 'border-purple-400',     badge: 'Illimité' },
]

const FEATURES = [
  { icon: Zap,     title: 'Connexion instantanée', desc: 'Scannez le QR code et votre WhatsApp est connecté en moins de 30 secondes.' },
  { icon: Shield,  title: 'Sécurité multi-tenant', desc: 'Chaque compte est isolé. Vos données et clés API sont strictement privées.' },
  { icon: Globe,   title: 'API REST complète',     desc: 'Intégrez WhatsApp dans vos apps via notre API REST documentée et simple.' },
  { icon: Activity,title: 'Monitoring temps réel', desc: 'Suivez l\'état de vos instances et messages en temps réel depuis le dashboard.' },
]

const STATS = [
  { value: '99.9%', label: 'Uptime garanti' },
  { value: '< 1s',  label: 'Temps de réponse' },
  { value: '100+',  label: 'Clients satisfaits' },
  { value: '24/7',  label: 'Support disponible' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span>WA Manager</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Tarifs</Link>
            <Link to="/admin-setup" className="text-xs text-muted-foreground/60 hover:text-orange-500 transition-colors hidden sm:block" title="Administration">⚙️</Link>
            <Button variant="ghost" size="sm" asChild><Link to="/login">Connexion</Link></Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" asChild>
              <Link to="/register">Démarrer gratuitement</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Service WhatsApp API professionnel
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Gérez vos instances{' '}
            <span className="text-emerald-600">WhatsApp</span>{' '}
            sans effort
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connectez, automatisez et gérez plusieurs numéros WhatsApp depuis un seul tableau de bord. API REST intégrée pour vos applications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-base" asChild>
              <Link to="/register" className="flex items-center gap-2">
                Commencer gratuitement <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">Voir les tarifs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
          <p className="text-muted-foreground text-lg">Une plateforme complète pour gérer WhatsApp en production</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FEATURES.map(f => (
            <div key={f.title} className="flex gap-4 p-6 rounded-xl border bg-card hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Tarifs simples et transparents</h2>
            <p className="text-muted-foreground text-lg">Commencez gratuitement, évoluez selon vos besoins</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map(p => (
              <div key={p.key} className={`relative p-6 rounded-xl border-2 bg-card flex flex-col ${p.color}`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-600 text-white whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <div className="text-3xl font-bold mb-1">
                  {p.price === 0 ? 'Gratuit' : `${p.price.toLocaleString()} FCFA`}
                </div>
                {p.price > 0 && <div className="text-xs text-muted-foreground mb-4">/mois</div>}
                {p.price === 0 && <div className="mb-4" />}
                <ul className="space-y-2 text-sm mb-6 flex-1">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{p.instances === 100 ? 'Instances illimitées' : `${p.instances} instance${p.instances > 1 ? 's' : ''}`}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />API REST complète</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Dashboard temps réel</li>
                  {p.key !== 'free' && <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />Support prioritaire</li>}
                </ul>
                <Button className={p.key === 'free' ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} variant={p.key === 'free' ? 'outline' : 'default'} asChild>
                  <Link to="/register">{p.key === 'free' ? 'Commencer' : 'Souscrire'}</Link>
                </Button>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="text-sm text-emerald-600 hover:underline flex items-center justify-center gap-1">
              Voir tous les détails <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Ce que disent nos clients</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Kouamé A.', role: 'Entrepreneur e-commerce', text: 'WA Manager a transformé notre support client. On envoie des confirmations de commande automatiquement à tous nos clients.' },
            { name: 'Fatou D.', role: 'Directrice marketing', text: 'L\'API est très simple à intégrer. En quelques heures, notre bot WhatsApp était en ligne et fonctionnel.' },
            { name: 'Jean-Marc O.', role: 'Développeur fullstack', text: 'La gestion multi-instances est parfaite. Je gère 5 numéros différents depuis un seul tableau de bord.' },
          ].map(t => (
            <div key={t.name} className="p-6 rounded-xl border bg-card">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Prêt à démarrer ?</h2>
          <p className="mb-8 text-emerald-100">Créez votre compte gratuitement et connectez votre premier numéro WhatsApp en moins de 5 minutes.</p>
          <Button size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50 text-base" asChild>
            <Link to="/register" className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Créer mon compte gratuit
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            WA Manager
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-foreground">Tarifs</Link>
            <Link to="/login" className="hover:text-foreground">Connexion</Link>
            <Link to="/register" className="hover:text-foreground">Inscription</Link>
          </div>
          <div>© {new Date().getFullYear()} WA Manager — Tous droits réservés</div>
        </div>
      </footer>
    </div>
  )
}
