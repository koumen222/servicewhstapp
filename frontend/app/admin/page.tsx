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

// ─── Admin Users Tab (CRUD) ─────────────────────────────────────────────
function AdminUsersTab({ users, setUsers, adminToken, onReload }: {
  users: any[];
  setUsers: (u: any[]) => void;
  adminToken: string | null;
  onReload: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"active"|"inactive"|"basic"|"premium">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editMaxInstances, setEditMaxInstances] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [error, setError] = useState("");

  const PLAN_COLORS: Record<string, string> = { basic: "#22c55e", premium: "#3b82f6", free: "#9ca3af" };

  const filtered = users.filter((u) => {
    const ms = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const mf = filter === "all" || (filter === "active" && u.isActive) || (filter === "inactive" && !u.isActive) || (filter === "basic" && u.plan === "basic") || (filter === "premium" && u.plan === "premium");
    return ms && mf;
  });

  async function handleToggle(userId: string) {
    if (!adminToken) return;
    setActionLoading(userId);
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${userId}/toggle`, {}, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data.success) setUsers(users.map(u => u._id === userId ? { ...u, isActive: res.data.data.isActive } : u));
    } catch (err: any) { setError(err.response?.data?.error || "Erreur"); }
    finally { setActionLoading(null); }
  }

  async function handleUpdatePlan() {
    if (!editUser || !adminToken) return;
    setActionLoading(editUser._id);
    try {
      const res = await axios.put(`${API_URL}/api/admin/users/${editUser._id}/plan`, { plan: editPlan, maxInstances: editMaxInstances }, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data.success) { setUsers(users.map(u => u._id === editUser._id ? { ...u, plan: editPlan, maxInstances: editMaxInstances } : u)); setEditUser(null); }
    } catch (err: any) { setError(err.response?.data?.error || "Erreur"); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(userId: string) {
    if (!adminToken) return;
    setActionLoading(userId);
    try {
      const res = await axios.delete(`${API_URL}/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data.success) { setUsers(users.filter(u => u._id !== userId)); setConfirmDelete(null); }
    } catch (err: any) { setError(err.response?.data?.error || "Erreur"); }
    finally { setActionLoading(null); }
  }

  async function handleViewDetails(userId: string) {
    if (!adminToken) return;
    setActionLoading(userId + "_d");
    try {
      const res = await axios.get(`${API_URL}/api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.data.success) setDetailUser(res.data.data);
    } catch (err: any) { setError(err.response?.data?.error || "Erreur"); }
    finally { setActionLoading(null); }
  }

  function openEdit(user: any) { setEditUser(user); setEditPlan(user.plan || "basic"); setEditMaxInstances(user.maxInstances || 1); }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {error && (
        <div className="rounded-xl px-4 py-2.5 text-xs text-red-400 flex items-center gap-2" style={{ background: "#1a0505", border: "1px solid #3b1111" }}>
          <AlertTriangle size={13} />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-300 hover:text-white"><XCircle size={13} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Utilisateurs", value: users.length, color: "text-white", sub: `${users.length} comptes` },
          { label: "Utilisateurs Actifs", value: users.filter(u => u.isActive).length, color: "text-green-400", sub: `${((users.filter(u => u.isActive).length / (users.length || 1)) * 100).toFixed(1)}% du total` },
          { label: "Nouveaux (7j)", value: users.filter(u => { const d = new Date(u.createdAt); const w = new Date(); w.setDate(w.getDate() - 7); return d >= w; }).length, color: "text-blue-400", sub: "Derniers 7 jours" },
          { label: "Premium", value: users.filter(u => u.plan === "premium").length, color: "text-purple-400", sub: "Plan Premium" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
            <h3 className="text-sm font-semibold text-white mb-2">{label}</h3>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par nom ou email…" className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-white bg-[#0a0a0a] border border-[#1e1e1e] focus:border-green-500/40 outline-none" />
        </div>
        <div className="flex gap-1.5">
          {(["all","active","inactive","basic","premium"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all" style={{ background: filter === f ? "#22c55e18" : "transparent", color: filter === f ? "#22c55e" : "#6b7280", border: `1px solid ${filter === f ? "#22c55e30" : "#1e1e1e"}` }}>
              {f === "all" ? "Tous" : f === "active" ? "Actifs" : f === "inactive" ? "Inactifs" : f}
            </button>
          ))}
        </div>
        <button onClick={onReload} className="ml-auto px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-400 hover:text-white border border-[#1e1e1e] hover:border-green-500/30 transition-all flex items-center gap-1.5">
          <RefreshCw size={12} /> Rafraîchir
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--card-border)" }}>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Utilisateur</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Plan</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Statut</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Paiement</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Instances</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-400">Inscription</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "var(--card-border)" }}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0" style={{ background: user.isActive ? "#0d2510" : "#1a0505", color: user.isActive ? "#22c55e" : "#ef4444" }}>
                        {(user.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full capitalize" style={{ background: `${PLAN_COLORS[user.plan] || "#666"}18`, color: PLAN_COLORS[user.plan] || "#666" }}>{user.plan}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 text-xs font-medium ${user.isActive ? "text-green-400" : "text-red-400"}`}>
                      {user.isActive ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {user.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ background: user.hasPaid ? "#22c55e18" : "#f59e0b18", color: user.hasPaid ? "#22c55e" : "#f59e0b" }}>
                      {user.hasPaid ? "Payé" : "Non payé"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-white">{user.maxInstances || 0}</td>
                  <td className="py-3 px-4 text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleViewDetails(user._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Voir détails">
                        {actionLoading === user._id + "_d" ? <Activity size={14} className="animate-spin" /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-all" title="Modifier plan">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleToggle(user._id)} disabled={actionLoading === user._id} className={`p-1.5 rounded-lg transition-all ${user.isActive ? "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}`} title={user.isActive ? "Désactiver" : "Activer"}>
                        {actionLoading === user._id ? <Activity size={14} className="animate-spin" /> : user.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                      </button>
                      <button onClick={() => setConfirmDelete(user)} className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all" title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-500 text-sm">Aucun utilisateur trouvé.</div>}
      </div>

      {/* Edit Plan Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditUser(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 w-full max-w-md space-y-5" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Modifier le plan</h3>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-white"><XCircle size={16} /></button>
            </div>
            <div><p className="text-sm text-white font-medium">{editUser.name}</p><p className="text-xs text-gray-400">{editUser.email}</p></div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Plan</label>
                <div className="flex gap-2">
                  {(["basic","premium"] as const).map((p) => (
                    <button key={p} onClick={() => { setEditPlan(p); setEditMaxInstances(p === "premium" ? 999 : 1); }} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold capitalize transition-all" style={{ background: editPlan === p ? `${PLAN_COLORS[p]}20` : "#0a0a0a", color: editPlan === p ? PLAN_COLORS[p] : "#6b7280", border: `1px solid ${editPlan === p ? `${PLAN_COLORS[p]}40` : "#1e1e1e"}` }}>
                      {editPlan === p && <CheckCircle size={11} className="inline mr-1" />}{p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5">Max Instances</label>
                <input type="number" min={1} value={editMaxInstances} onChange={(e) => setEditMaxInstances(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 rounded-lg text-xs text-white bg-[#0a0a0a] border border-[#1e1e1e] focus:border-green-500/40 outline-none" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setEditUser(null)} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 border border-[#1e1e1e] hover:bg-white/5 transition-all">Annuler</button>
              <button onClick={handleUpdatePlan} disabled={actionLoading === editUser._id} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-500 transition-all disabled:opacity-50">
                {actionLoading === editUser._id ? <Activity size={13} className="animate-spin inline mr-1" /> : null}Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 w-full max-w-sm space-y-4" style={{ background: "#111", border: "1px solid #3b1111" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><AlertTriangle size={20} className="text-red-400" /></div>
              <div><h3 className="text-sm font-semibold text-white">Supprimer l&apos;utilisateur</h3><p className="text-xs text-gray-400">Cette action est irréversible</p></div>
            </div>
            <div className="rounded-lg p-3" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
              <p className="text-sm text-white font-medium">{confirmDelete.name}</p>
              <p className="text-xs text-gray-400">{confirmDelete.email}</p>
              <p className="text-xs text-gray-500 mt-1">Plan: {confirmDelete.plan} · Instances: {confirmDelete.maxInstances}</p>
            </div>
            <p className="text-xs text-red-400/80">Toutes les instances WhatsApp de cet utilisateur seront également supprimées.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-medium text-gray-400 border border-[#1e1e1e] hover:bg-white/5 transition-all">Annuler</button>
              <button onClick={() => handleDelete(confirmDelete._id)} disabled={actionLoading === confirmDelete._id} className="flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-50">
                {actionLoading === confirmDelete._id ? <Activity size={13} className="animate-spin inline mr-1" /> : <Trash2 size={13} className="inline mr-1" />}Supprimer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetailUser(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[80vh] overflow-y-auto" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Détails utilisateur</h3>
              <button onClick={() => setDetailUser(null)} className="text-gray-400 hover:text-white"><XCircle size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Nom", value: detailUser.user?.name },
                { label: "Email", value: detailUser.user?.email },
                { label: "Plan", value: detailUser.user?.plan },
                { label: "Max Instances", value: detailUser.user?.maxInstances },
                { label: "Statut", value: detailUser.user?.isActive ? "Actif" : "Inactif" },
                { label: "Paiement", value: detailUser.user?.hasPaid ? "Payé" : "Non payé" },
                { label: "Inscrit le", value: detailUser.user?.createdAt ? new Date(detailUser.user.createdAt).toLocaleDateString("fr-FR") : "-" },
                { label: "Email vérifié", value: detailUser.user?.emailVerified ? "Oui" : "Non" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-2.5" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
                  <p className="text-[10px] text-gray-500">{label}</p>
                  <p className="text-xs text-white font-medium mt-0.5">{String(value ?? "-")}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
              <p className="text-xs text-gray-400 mb-3 font-medium">Instances WhatsApp</p>
              <div className="flex gap-6">
                <div><p className="text-lg font-bold text-green-400">{detailUser.stats?.totalInstances || 0}</p><p className="text-[10px] text-gray-500">Total</p></div>
                <div><p className="text-lg font-bold text-blue-400">{detailUser.stats?.activeInstances || 0}</p><p className="text-[10px] text-gray-500">Actives</p></div>
                <div><p className="text-lg font-bold text-yellow-400">{detailUser.stats?.connectedInstances || 0}</p><p className="text-[10px] text-gray-500">Connectées</p></div>
              </div>
            </div>
            {detailUser.instances?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Instances</p>
                {detailUser.instances.map((inst: any) => (
                  <div key={inst._id} className="rounded-lg p-3 flex items-center justify-between" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
                    <div><p className="text-xs text-white font-medium">{inst.instanceName}</p><p className="text-[10px] text-gray-500">{inst.createdAt ? new Date(inst.createdAt).toLocaleDateString("fr-FR") : ""}</p></div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${inst.status === "open" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{inst.status || "unknown"}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
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
          <AdminUsersTab
            users={users}
            setUsers={setUsers}
            adminToken={adminToken}
            onReload={() => adminToken && loadAllData(adminToken)}
          />
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
