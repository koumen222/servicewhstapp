"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Server,
  Activity,
  TrendingUp,
  Eye,
  Lock,
  Unlock,
  Edit,
  Trash2,
  LogOut,
  BarChart3,
  DollarSign,
  MessageSquare,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Zap,
  Globe,
  Smartphone,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Settings,
  Bell,
  Search
} from "lucide-react";
import axios from "axios";
import { KPICard } from "@/components/metrics/KPICard";
import { AdvancedLineChart } from "@/components/charts/AdvancedLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { AdvancedBarChart } from "@/components/charts/BarChart";
import { format, subDays, startOfDay } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalInstances: number;
  activeInstances: number;
  instancesByStatus: Record<string, number>;
  usersByPlan: Record<string, number>;
}

interface User {
  _id: string;
  email: string;
  name: string;
  plan: string;
  maxInstances: number;
  isActive: boolean;
  createdAt: string;
}

interface Instance {
  _id: string;
  instanceName: string;
  customName: string;
  status: string;
  isActive: boolean;
  userId: {
    email: string;
    name: string;
    plan: string;
  };
  createdAt: string;
}

// Données mockées pour les analytiques avancées
const generateMockData = () => {
  const dates = [];
  const userGrowth = [];
  const messageVolume = [];
  const revenue = [];
  
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    dates.push(date);
    userGrowth.push({
      date,
      value: Math.floor(Math.random() * 50) + 100 + (30 - i) * 2
    });
    messageVolume.push({
      date,
      value: Math.floor(Math.random() * 1000) + 2000 + (30 - i) * 50
    });
    revenue.push({
      date,
      value: Math.floor(Math.random() * 500) + 1000 + (30 - i) * 20
    });
  }

  return { dates, userGrowth, messageVolume, revenue };
};

const mockData = generateMockData();

const planDistribution = [
  { name: 'Free', value: 450, color: '#94a3b8' },
  { name: 'Starter', value: 280, color: '#3b82f6' },
  { name: 'Pro', value: 150, color: '#8b5cf6' },
  { name: 'Enterprise', value: 45, color: '#f59e0b' }
];

const deviceStats = [
  { name: 'Mobile', value: 65, color: '#22c55e' },
  { name: 'Desktop', value: 25, color: '#3b82f6' },
  { name: 'Tablet', value: 10, color: '#f59e0b' }
];

const topCountries = [
  { name: 'France', value: 340, trend: 12 },
  { name: 'Belgique', value: 180, trend: -5 },
  { name: 'Suisse', value: 120, trend: 8 },
  { name: 'Canada', value: 95, trend: 15 },
  { name: 'Maroc', value: 85, trend: -3 }
];

export default function AdvancedAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "analytics" | "users" | "instances" | "revenue">("dashboard");
  
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    if (token && info) {
      setAdminToken(token);
      setAdminInfo(JSON.parse(info));
      setIsAuthenticated(true);
      loadDashboardData(token);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/admin/login`, {
        email,
        password,
      });

      if (res.data.success) {
        const { token, admin } = res.data.data;
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminInfo", JSON.stringify(admin));
        setAdminToken(token);
        setAdminInfo(admin);
        setIsAuthenticated(true);
        loadDashboardData(token);
      }
    } catch (error: any) {
      setLoginError(error.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboardData(token: string) {
    try {
      const [statsRes, usersRes, instancesRes, kpiRes, growthRes, revenueRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/users?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/instances?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/analytics/kpi`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/analytics/growth?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/analytics/revenue`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data.users);
      if (instancesRes.data.success) setInstances(instancesRes.data.data.instances);
      if (kpiRes.data.success) console.log('KPIs loaded:', kpiRes.data.data);
      if (growthRes.data.success) console.log('Growth data loaded:', growthRes.data.data);
      if (revenueRes.data.success) console.log('Revenue data loaded:', revenueRes.data.data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  async function handleRefresh() {
    if (!adminToken) return;
    setIsRefreshing(true);
    await loadDashboardData(adminToken);
    setTimeout(() => setIsRefreshing(false), 1000);
  }

  function handleLogout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminInfo");
    setAdminToken(null);
    setAdminInfo(null);
    setIsAuthenticated(false);
    setEmail("");
    setPassword("");
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl"
          style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Connectez-vous pour accéder au panneau d'administration avancé</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark w-full"
                placeholder="admin@whatsapp-saas.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{loginError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-green w-full"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="border-b" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-xs text-gray-400">
                Connecté en tant que {adminInfo?.name} ({adminInfo?.role})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : 'hover:bg-gray-700'}`}
              style={{ background: "var(--input-bg)" }}
            >
              <RefreshCw size={16} className="text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-700 transition-all" style={{ background: "var(--input-bg)" }}>
              <Bell size={16} className="text-gray-400" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-700 transition-all" style={{ background: "var(--input-bg)" }}>
              <Settings size={16} className="text-gray-400" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {[
                { id: "dashboard", label: "Vue d'ensemble", icon: BarChart3 },
                { id: "analytics", label: "Analytique", icon: TrendingUp },
                { id: "revenue", label: "Revenus", icon: DollarSign },
                { id: "users", label: "Utilisateurs", icon: Users },
                { id: "instances", label: "Instances", icon: Server },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-green-500 text-white"
                      : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border"
                style={{ 
                  background: "var(--input-bg)", 
                  borderColor: "var(--card-border)",
                  color: "#9ca3af"
                }}
              >
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
                <option value="90d">90 jours</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Utilisateurs totaux"
                value={stats?.totalUsers || 925}
                subtitle={`${stats?.activeUsers || 680} actifs`}
                change={12.5}
                changeType="increase"
                icon={Users}
                color="blue"
              />
              <KPICard
                title="Instances WhatsApp"
                value={stats?.totalInstances || 342}
                subtitle={`${stats?.activeInstances || 298} connectées`}
                change={8.3}
                changeType="increase"
                icon={Server}
                color="green"
              />
              <KPICard
                title="Messages envoyés"
                value="45.2K"
                subtitle="Aujourd'hui"
                change={15.7}
                changeType="increase"
                icon={MessageSquare}
                color="purple"
              />
              <KPICard
                title="Revenus mensuels"
                value={12480}
                subtitle="MRR"
                change={-2.4}
                changeType="decrease"
                icon={DollarSign}
                color="orange"
                format="currency"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLineChart
                data={mockData.userGrowth}
                title="Croissance des utilisateurs"
                color="#3b82f6"
                gradient={true}
              />
              <AdvancedLineChart
                data={mockData.messageVolume}
                title="Volume de messages"
                color="#22c55e"
                gradient={true}
              />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DonutChart
                data={planDistribution}
                title="Distribution des plans"
                centerLabel="Total"
                centerValue="925"
              />
              <DonutChart
                data={deviceStats}
                title="Appareils utilisés"
                centerLabel="Sessions"
                centerValue="89.2K"
              />
              <AdvancedBarChart
                data={topCountries}
                title="Pays les plus actifs"
                showTrend={true}
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Activité récente</h3>
                <div className="space-y-3">
                  {[
                    { icon: Users, text: "Nouvel utilisateur inscrit", time: "Il y a 2 min", color: "text-green-400" },
                    { icon: Server, text: "Instance WhatsApp créée", time: "Il y a 5 min", color: "text-blue-400" },
                    { icon: MessageSquare, text: "Pic de messages détecté", time: "Il y a 12 min", color: "text-purple-400" },
                    { icon: AlertCircle, text: "Alerte système résolue", time: "Il y a 25 min", color: "text-orange-400" },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--input-bg)" }}>
                      <activity.icon size={16} className={activity.color} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{activity.text}</p>
                        <p className="text-xs text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Métriques système</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">CPU</span>
                      <span className="text-white">45%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: "45%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Mémoire</span>
                      <span className="text-white">68%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: "68%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Stockage</span>
                      <span className="text-white">32%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: "32%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">Bande passante</span>
                      <span className="text-white">89%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: "89%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLineChart
                data={mockData.revenue}
                title="Évolution des revenus"
                color="#22c55e"
                gradient={true}
                formatValue={(v) => `€${v.toLocaleString()}`}
              />
              <AdvancedLineChart
                data={mockData.messageVolume}
                title="Tendances d'utilisation"
                color="#8b5cf6"
                gradient={true}
                formatValue={(v) => `${v.toLocaleString()} msg`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <KPICard
                title="Taux de conversion"
                value="3.2%"
                subtitle="Visiteurs → Inscrits"
                change={5.8}
                changeType="increase"
                icon={Target}
                color="green"
                format="percentage"
              />
              <KPICard
                title="Engagement moyen"
                value="78%"
                subtitle="Sessions actives"
                change={12.3}
                changeType="increase"
                icon={Activity}
                color="purple"
                format="percentage"
              />
              <KPICard
                title="Rétention (30j)"
                value="64%"
                subtitle="Utilisateurs conservés"
                change={-1.2}
                changeType="decrease"
                icon={Award}
                color="orange"
                format="percentage"
              />
            </div>

            <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Analyse comportementale</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Durée moyenne de session", value: "8m 32s", change: 12 },
                  { label: "Pages par session", value: "4.7", change: 8 },
                  { label: "Taux de rebond", value: "32%", change: -5 },
                  { label: "Score de satisfaction", value: "4.6/5", change: 3 },
                ].map((metric, index) => (
                  <div key={index} className="p-4 rounded-lg" style={{ background: "var(--input-bg)" }}>
                    <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                    <p className="text-lg font-semibold text-white mb-1">{metric.value}</p>
                    <p className={`text-xs ${metric.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.change > 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "revenue" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Revenus mensuels"
                value={12480}
                subtitle="MRR"
                change={8.5}
                changeType="increase"
                icon={DollarSign}
                color="green"
                format="currency"
              />
              <KPICard
                title="Revenus annuels"
                value={145600}
                subtitle="ARR"
                change={12.3}
                changeType="increase"
                icon={TrendingUp}
                color="blue"
                format="currency"
              />
              <KPICard
                title="Valeur client vie"
                value={2840}
                subtitle="LTV"
                change={5.2}
                changeType="increase"
                icon={Users}
                color="purple"
                format="currency"
              />
              <KPICard
                title="Coût acquisition"
                value={156}
                subtitle="CAC"
                change={-8.7}
                changeType="decrease"
                icon={Target}
                color="orange"
                format="currency"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLineChart
                data={mockData.revenue}
                title="Revenus par jour"
                color="#22c55e"
                gradient={true}
                formatValue={(v) => `€${v.toLocaleString()}`}
              />
              <DonutChart
                data={planDistribution}
                title="Revenus par plan"
                centerLabel="Total"
                centerValue="€12.5K"
              />
            </div>

            <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Prévisions de revenus</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { period: "Prochain mois", amount: "€13,240", growth: "+6.2%" },
                  { period: "Prochain trimestre", amount: "€41,850", growth: "+18.5%" },
                  { period: "Prochain semestre", amount: "€89,200", growth: "+34.7%" },
                ].map((forecast, index) => (
                  <div key={index} className="p-4 rounded-lg border" style={{ borderColor: "var(--card-border)" }}>
                    <p className="text-xs text-gray-400 mb-1">{forecast.period}</p>
                    <p className="text-xl font-bold text-white mb-1">{forecast.amount}</p>
                    <p className="text-sm text-green-400">{forecast.growth}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Gestion des utilisateurs</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--card-border)", background: "var(--input-bg)" }}>
                  <Download size={14} />
                  Exporter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--card-border)", background: "var(--input-bg)" }}>
                  <Filter size={14} />
                  Filtrer
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <table className="w-full">
                <thead style={{ background: "var(--input-bg)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Instances</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Messages</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Revenus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {users.slice(0, 10).map((user) => (
                    <tr key={user._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-400 capitalize">
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{user.maxInstances}</td>
                      <td className="px-4 py-3 text-sm text-white">{Math.floor(Math.random() * 1000)}</td>
                      <td className="px-4 py-3 text-sm text-white">€{Math.floor(Math.random() * 200)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {user.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded hover:bg-gray-700 transition-colors">
                            <Eye size={14} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-gray-700 transition-colors">
                            <Edit size={14} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-gray-700 transition-colors">
                            {user.isActive ? (
                              <Lock size={14} className="text-gray-400" />
                            ) : (
                              <Unlock size={14} className="text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "instances" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Gestion des instances</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--card-border)", background: "var(--input-bg)" }}>
                  <Download size={14} />
                  Exporter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--card-border)", background: "var(--input-bg)" }}>
                  <Filter size={14} />
                  Filtrer
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <table className="w-full">
                <thead style={{ background: "var(--input-bg)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Instance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Messages</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Uptime</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {instances.slice(0, 10).map((instance) => (
                    <tr key={instance._id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{instance.customName}</p>
                          <p className="text-xs text-gray-400">{instance.instanceName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-white">{instance.userId?.name}</p>
                          <p className="text-xs text-gray-400">{instance.userId?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{Math.floor(Math.random() * 5000)}</td>
                      <td className="px-4 py-3 text-sm text-white">{(Math.random() * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            instance.status === "open"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {instance.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded hover:bg-gray-700 transition-colors">
                            <Eye size={14} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-gray-700 transition-colors">
                            <RefreshCw size={14} className="text-gray-400" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-red-500/10 transition-colors">
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
