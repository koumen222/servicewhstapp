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
  Search,
  Mail,
  Send,
  Calendar as CalendarIcon,
  MapPin,
  Monitor,
  MousePointer,
  UserCheck,
  UserX,
  ShoppingCart,
  CreditCard,
  PieChart,
  LineChart as LineChartIcon,
  Database,
  Wifi,
  WifiOff,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  FileText,
  Megaphone,
  Timer,
  TrendingDown,
  Hash,
  Link,
  ExternalLink
} from "lucide-react";
import axios from "axios";
import { KPICard } from "@/components/metrics/KPICard";
import { AdvancedLineChart } from "@/components/charts/AdvancedLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { AdvancedBarChart } from "@/components/charts/BarChart";
import { format, subDays, startOfDay } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface AnalyticsStats {
  period: string;
  totalPageViews: number;
  totalSessions: number;
  totalUsers: number;
  totalEvents: number;
  totalConversions: number;
  activeUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topCountries: any[];
  topPages: any[];
  deviceStats: any[];
  browserStats: any[];
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  scheduledFor?: string;
  sentAt?: string;
  isActive: boolean;
  clickCount: number;
  viewCount: number;
  createdAt: string;
}

interface EmailCampaign {
  _id: string;
  name: string;
  subject: string;
  type: string;
  targetAudience: string;
  status: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  url?: string;
  timestamp: string;
  user?: any;
  metadata?: any;
}

export default function UltraAdvancedAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [activeSubTab, setActiveSubTab] = useState<string>("dashboard");
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    targetAudience: 'all',
    scheduledFor: ''
  });

  // Email campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'newsletter',
    targetAudience: 'all',
    scheduledFor: ''
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const info = localStorage.getItem("adminInfo");
    if (token && info) {
      setAdminToken(token);
      setAdminInfo(JSON.parse(info));
      setIsAuthenticated(true);
      loadAllData(token);
    }
  }, [timeRange]);

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
        loadAllData(token);
      }
    } catch (error: any) {
      setLoginError(error.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function loadAllData(token: string) {
    try {
      console.log("🔐 Loading admin data with token:", token.substring(0, 20) + "...");
      
      const [
        statsRes,
        growthRes,
        notificationsRes,
        campaignsRes,
        activityRes,
        countriesRes,
        pagesRes,
        devicesRes,
        browsersRes,
        usersRes,
        instancesRes
      ] = await Promise.all([
        axios.get(`${API_URL}/api/analytics/stats?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/growth?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/campaigns`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/countries?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/pages?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/devices?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/analytics/browsers?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/users?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/instances?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (statsRes.data.success) {
        const statsData = statsRes.data.data;
        setStats({
          ...statsData,
          topCountries: countriesRes.data.data,
          topPages: pagesRes.data.data,
          deviceStats: devicesRes.data.data,
          browserStats: browsersRes.data.data
        });
      }
      
      if (growthRes.data.success) setGrowthData(growthRes.data.data);
      if (notificationsRes.data.success) setNotifications(notificationsRes.data.data);
      if (campaignsRes.data.success) setCampaigns(campaignsRes.data.data);
      if (activityRes.data.success) setActivity(activityRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data.users || []);
      if (instancesRes.data.success) setInstances(instancesRes.data.data.instances || []);
      
      console.log("✅ Admin data loaded successfully");
    } catch (error: any) {
      console.error("❌ Error loading admin data:", error);
      
      // Gestion spécifique des erreurs 401
      if (error.response?.status === 401) {
        console.error("🔴 Token invalide ou expiré");
        // Effacer le token et rediriger vers le login
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminInfo");
        setAdminToken(null);
        setAdminInfo(null);
        setIsAuthenticated(false);
        setLoginError("Session expirée. Veuillez vous reconnecter.");
      }
    }
  }

  async function handleRefresh() {
    if (!adminToken) return;
    setIsRefreshing(true);
    await loadAllData(adminToken);
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

  async function handleCreateNotification() {
    if (!adminToken) return;
    
    try {
      await axios.post(`${API_URL}/api/analytics/notifications`, notificationForm, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      setNotificationForm({
        title: '',
        message: '',
        type: 'info',
        targetAudience: 'all',
        scheduledFor: ''
      });
      
      loadAllData(adminToken);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async function handleCreateCampaign() {
    if (!adminToken) return;
    
    try {
      await axios.post(`${API_URL}/api/analytics/campaigns`, campaignForm, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      setCampaignForm({
        name: '',
        subject: '',
        content: '',
        type: 'newsletter',
        targetAudience: 'all',
        scheduledFor: ''
      });
      
      loadAllData(adminToken);
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
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
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard Ultra-Advanced</h1>
            <p className="text-sm text-gray-400">Analytics complet avec notifications et emailing</p>
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return MousePointer;
      case 'page_view': return Eye;
      case 'form_submit': return FileText;
      case 'signup': return UserCheck;
      case 'login': return UserCheck;
      case 'purchase': return ShoppingCart;
      default: return Activity;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

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
              <h1 className="text-xl font-bold text-white">Admin Dashboard Ultra-Advanced</h1>
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

      {/* Main Navigation */}
      <div className="border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              {[
                { id: "overview", label: "Vue d'ensemble", icon: BarChart3 },
                { id: "analytics", label: "Analytique", icon: TrendingUp },
                { id: "traffic", label: "Trafic", icon: Globe },
                { id: "conversions", label: "Conversions", icon: Target },
                { id: "users", label: "Utilisateurs", icon: Users },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "emailing", label: "Emailing", icon: Mail },
                { id: "system", label: "Système", icon: Database }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveSubTab('dashboard');
                  }}
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

      {/* Sub-Navigation */}
      {(activeTab === 'analytics' || activeTab === 'traffic' || activeTab === 'conversions' || activeTab === 'system') && (
        <div className="border-b" style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-4">
              {activeTab === 'analytics' && [
                { id: "dashboard", label: "Dashboard", icon: BarChart3 },
                { id: "realtime", label: "Temps réel", icon: Activity },
                { id: "events", label: "Événements", icon: Target },
                { id: "funnel", label: "Entonnoir", icon: TrendingUp }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeSubTab === subTab.id
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <subTab.icon size={14} />
                  {subTab.label}
                </button>
              ))}

              {activeTab === 'traffic' && [
                { id: "sources", label: "Sources", icon: Link },
                { id: "pages", label: "Pages", icon: FileText },
                { id: "countries", label: "Pays", icon: MapPin },
                { id: "devices", label: "Appareils", icon: Monitor }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeSubTab === subTab.id
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <subTab.icon size={14} />
                  {subTab.label}
                </button>
              ))}

              {activeTab === 'conversions' && [
                { id: "overview", label: "Vue d'ensemble", icon: Target },
                { id: "goals", label: "Objectifs", icon: Award },
                { id: "ecommerce", label: "E-commerce", icon: ShoppingCart }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeSubTab === subTab.id
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <subTab.icon size={14} />
                  {subTab.label}
                </button>
              ))}

              {activeTab === 'system' && [
                { id: "health", label: "Santé", icon: Activity },
                { id: "performance", label: "Performance", icon: Zap },
                { id: "logs", label: "Logs", icon: FileText }
              ].map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    activeSubTab === subTab.id
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  <subTab.icon size={14} />
                  {subTab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                title="Pages vues"
                value={stats?.totalPageViews || 0}
                subtitle="Total"
                change={12.5}
                changeType="increase"
                icon={Eye}
                color="blue"
              />
              <KPICard
                title="Sessions"
                value={stats?.totalSessions || 0}
                subtitle="Uniques"
                change={8.3}
                changeType="increase"
                icon={Activity}
                color="green"
              />
              <KPICard
                title="Utilisateurs actifs"
                value={stats?.activeUsers || 0}
                subtitle="Mois en cours"
                change={15.7}
                changeType="increase"
                icon={Users}
                color="purple"
              />
              <KPICard
                title="Taux de conversion"
                value={`${stats?.conversionRate.toFixed(1) || 0}%`}
                subtitle="Sessions → Conversions"
                change={5.2}
                changeType="increase"
                icon={Target}
                color="orange"
                format="percentage"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedLineChart
                data={growthData.map(d => ({ date: d.date, value: d.pageViews }))}
                title="Pages vues par jour"
                color="#3b82f6"
                gradient={true}
              />
              <AdvancedLineChart
                data={growthData.map(d => ({ date: d.date, value: d.sessions }))}
                title="Sessions par jour"
                color="#22c55e"
                gradient={true}
              />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Métriques d'engagement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Durée moyenne de session</span>
                    <span className="text-sm font-medium text-white">{formatDuration(stats?.avgSessionDuration || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Taux de rebond</span>
                    <span className="text-sm font-medium text-white">{(stats?.bounceRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Pages par session</span>
                    <span className="text-sm font-medium text-white">{((stats?.totalPageViews || 0) / (stats?.totalSessions || 1)).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Événements totaux</span>
                    <span className="text-sm font-medium text-white">{stats?.totalEvents || 0}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Top pays</h3>
                <div className="space-y-2">
                  {stats?.topCountries.slice(0, 5).map((country: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{country._id}</span>
                      <span className="text-sm font-medium text-white">{country.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Top pages</h3>
                <div className="space-y-2">
                  {stats?.topPages.slice(0, 5).map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 truncate max-w-[120px]">{page.url}</span>
                      <span className="text-sm font-medium text-white">{page.views}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Activité récente</h3>
              <div className="space-y-3">
                {activity.slice(0, 10).map((item, index) => {
                  const Icon = getActivityIcon(item.type);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--input-bg)" }}>
                      <Icon size={16} className="text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.action}</p>
                        <p className="text-xs text-gray-400">{item.category} • {new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                      {item.user && (
                        <span className="text-xs text-gray-400">{item.user.name}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "traffic" && activeSubTab === "countries" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Pays les plus visités</h2>
              <button className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border" style={{ borderColor: "var(--card-border)", background: "var(--input-bg)" }}>
                <Download size={14} />
                Exporter
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdvancedBarChart
                data={stats?.topCountries.map(c => ({ name: c._id, value: c.count })) || []}
                title="Visites par pays"
                height={400}
              />
              
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Détails par pays</h3>
                <div className="space-y-3">
                  {stats?.topCountries.map((country: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--input-bg)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <MapPin size={14} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{country._id}</p>
                          <p className="text-xs text-gray-400">{country.count} visites</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {((country.count / (stats?.totalPageViews || 1)) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-400">du total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "notifications" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Notification */}
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Megaphone size={16} />
                  Créer une notification
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Titre</label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                      className="input-dark w-full"
                      placeholder="Titre de la notification"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Message</label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                      className="input-dark w-full h-20 resize-none"
                      placeholder="Contenu de la notification"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm({...notificationForm, type: e.target.value})}
                      className="input-dark w-full"
                    >
                      <option value="info">Information</option>
                      <option value="success">Succès</option>
                      <option value="warning">Attention</option>
                      <option value="error">Erreur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Audience cible</label>
                    <select
                      value={notificationForm.targetAudience}
                      onChange={(e) => setNotificationForm({...notificationForm, targetAudience: e.target.value})}
                      className="input-dark w-full"
                    >
                      <option value="all">Tous les utilisateurs</option>
                      <option value="users">Utilisateurs standards</option>
                      <option value="admins">Administrateurs</option>
                      <option value="premium">Utilisateurs premium</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Programmer pour (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={notificationForm.scheduledFor}
                      onChange={(e) => setNotificationForm({...notificationForm, scheduledFor: e.target.value})}
                      className="input-dark w-full"
                    />
                  </div>
                  <button
                    onClick={handleCreateNotification}
                    className="btn-green w-full flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Créer la notification
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Bell size={16} />
                  Notifications récentes
                </h3>
                <div className="space-y-3">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification._id} className="p-4 rounded-lg border" style={{ borderColor: "var(--card-border)" }}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'success' ? 'bg-green-500/10' :
                            notification.type === 'warning' ? 'bg-orange-500/10' :
                            notification.type === 'error' ? 'bg-red-500/10' :
                            'bg-blue-500/10'
                          }`}>
                            <Icon size={14} className={
                              notification.type === 'success' ? 'text-green-400' :
                              notification.type === 'warning' ? 'text-orange-400' :
                              notification.type === 'error' ? 'text-red-400' :
                              'text-blue-400'
                            } />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">{notification.title}</h4>
                            <p className="text-xs text-gray-400 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Audience: {notification.targetAudience}</span>
                              <span>Vues: {notification.viewCount}</span>
                              <span>Clics: {notification.clickCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "emailing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Email Campaign */}
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Megaphone size={16} />
                  Créer une campagne email
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Nom de la campagne</label>
                    <input
                      type="text"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                      className="input-dark w-full"
                      placeholder="Newsletter de mars"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Sujet</label>
                    <input
                      type="text"
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm({...campaignForm, subject: e.target.value})}
                      className="input-dark w-full"
                      placeholder="Sujet de l'email"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Contenu</label>
                    <textarea
                      value={campaignForm.content}
                      onChange={(e) => setCampaignForm({...campaignForm, content: e.target.value})}
                      className="input-dark w-full h-32 resize-none"
                      placeholder="Contenu de l'email (HTML supporté)"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Type de campagne</label>
                    <select
                      value={campaignForm.type}
                      onChange={(e) => setCampaignForm({...campaignForm, type: e.target.value})}
                      className="input-dark w-full"
                    >
                      <option value="newsletter">Newsletter</option>
                      <option value="promotional">Promotionnelle</option>
                      <option value="transactional">Transactionnelle</option>
                      <option value="notification">Notification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Audience cible</label>
                    <select
                      value={campaignForm.targetAudience}
                      onChange={(e) => setCampaignForm({...campaignForm, targetAudience: e.target.value})}
                      className="input-dark w-full"
                    >
                      <option value="all">Tous les utilisateurs</option>
                      <option value="users">Utilisateurs standards</option>
                      <option value="admins">Administrateurs</option>
                      <option value="premium">Utilisateurs premium</option>
                      <option value="custom">Personnalisée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Programmer pour (optionnel)</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.scheduledFor}
                      onChange={(e) => setCampaignForm({...campaignForm, scheduledFor: e.target.value})}
                      className="input-dark w-full"
                    />
                  </div>
                  <button
                    onClick={handleCreateCampaign}
                    className="btn-green w-full flex items-center justify-center gap-2"
                  >
                    <Mail size={16} />
                    Créer la campagne
                  </button>
                </div>
              </div>

              {/* Campaigns List */}
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Mail size={16} />
                  Campagnes récentes
                </h3>
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div key={campaign._id} className="p-4 rounded-lg border" style={{ borderColor: "var(--card-border)" }}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-white">{campaign.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          campaign.status === 'sent' ? 'bg-green-500/10 text-green-400' :
                          campaign.status === 'scheduled' ? 'bg-blue-500/10 text-blue-400' :
                          campaign.status === 'sending' ? 'bg-orange-500/10 text-orange-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">{campaign.subject}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Destinataires:</span>
                          <span className="text-white">{campaign.totalRecipients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Envoyés:</span>
                          <span className="text-white">{campaign.sentCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ouverts:</span>
                          <span className="text-white">{campaign.openedCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cliqués:</span>
                          <span className="text-white">{campaign.clickedCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section Utilisateurs */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Users */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Total Utilisateurs</h3>
                <p className="text-2xl font-bold text-white">{users.length}</p>
                <p className="text-xs text-green-400 mt-1">+12% ce mois</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Utilisateurs Actifs</h3>
                <p className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive).length}</p>
                <p className="text-xs text-gray-400 mt-1">{((users.filter(u => u.isActive).length / (users.length || 1)) * 100).toFixed(1)}% du total</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Nouveaux (7j)</h3>
                <p className="text-2xl font-bold text-blue-400">
                  {users.filter(u => {
                    const created = new Date(u.createdAt);
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    return created >= sevenDaysAgo;
                  }).length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Derniers 7 jours</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Premium</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {users.filter(u => u.plan === 'pro' || u.plan === 'enterprise').length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Pro & Enterprise</p>
              </div>
            </div>

            {/* Table Users */}
            <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Liste des utilisateurs</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--card-border)" }}>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Utilisateur</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Plan</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Statut</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Instances</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 10).map((user) => (
                      <tr key={user._id} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.plan === 'enterprise' ? 'bg-purple-500/10 text-purple-400' :
                            user.plan === 'pro' ? 'bg-green-500/10 text-green-400' :
                            user.plan === 'starter' ? 'bg-blue-500/10 text-blue-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs ${user.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-white">
                          {user.maxInstances || 0}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section Instances */}
        {activeTab === "instances" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Instances */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Total Instances</h3>
                <p className="text-2xl font-bold text-white">{instances.length}</p>
                <p className="text-xs text-green-400 mt-1">+8% ce mois</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Connectées</h3>
                <p className="text-2xl font-bold text-green-400">
                  {instances.filter(i => i.status === 'connected').length}
                </p>
                <p className="text-xs text-gray-400 mt-1">WhatsApp actif</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">Déconnectées</h3>
                <p className="text-2xl font-bold text-red-400">
                  {instances.filter(i => i.status === 'disconnected').length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Nécessitent attention</p>
              </div>
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-2">En attente QR</h3>
                <p className="text-2xl font-bold text-yellow-400">
                  {instances.filter(i => i.status === 'pending_qr').length}
                </p>
                <p className="text-xs text-gray-400 mt-1">Scan QR code requis</p>
              </div>
            </div>

            {/* Table Instances */}
            <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <h3 className="text-sm font-semibold text-white mb-4">Liste des instances</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: "var(--card-border)" }}>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Instance</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Propriétaire</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Statut</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Créée le</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Dernière activité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instances.slice(0, 10).map((instance) => (
                      <tr key={instance._id} className="border-b" style={{ borderColor: "var(--card-border)" }}>
                        <td className="py-3 px-4">
                          <p className="text-sm font-medium text-white">{instance.name}</p>
                          <p className="text-xs text-gray-400">ID: {instance._id.slice(-8)}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-white">{instance.userName || instance.userId?.slice(-8)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            instance.status === 'connected' ? 'bg-green-500/10 text-green-400' :
                            instance.status === 'disconnected' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {instance.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {new Date(instance.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-400">
                          {instance.lastActivity ? new Date(instance.lastActivity).toLocaleString('fr-FR') : 'Jamais'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* Placeholder pour autres onglets */}
        {activeTab !== "overview" && activeTab !== "traffic" && activeTab !== "notifications" && activeTab !== "emailing" && activeTab !== "users" && activeTab !== "instances" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {activeTab === "analytics" && "Analytique avancée"}
              {activeTab === "conversions" && "Suivi des conversions"}
              {activeTab === "system" && "Monitoring système"}
            </h3>
            <p className="text-sm text-gray-400">
              {activeSubTab && `Sous-menu: ${activeSubTab}`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
