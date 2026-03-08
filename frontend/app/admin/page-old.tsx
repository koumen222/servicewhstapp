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
} from "lucide-react";
import axios from "axios";

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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "instances">("dashboard");
  
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<any>(null);

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
      const [statsRes, usersRes, instancesRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/users?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/admin/instances?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (usersRes.data.success) setUsers(usersRes.data.data.users);
      if (instancesRes.data.success) setInstances(instancesRes.data.data.instances);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
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

  async function toggleUserStatus(userId: string) {
    if (!adminToken) return;
    try {
      await axios.put(
        `${API_URL}/api/admin/users/${userId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      loadDashboardData(adminToken);
    } catch (error) {
      console.error("Error toggling user:", error);
    }
  }

  async function deleteInstance(instanceId: string) {
    if (!adminToken || !confirm("Supprimer cette instance ?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/instances/${instanceId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      loadDashboardData(adminToken);
    } catch (error) {
      console.error("Error deleting instance:", error);
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
            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Connectez-vous pour accéder au panneau d'administration</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-dark w-full"
                placeholder="admin@example.com"
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
          <div>
            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Connecté en tant que {adminInfo?.name} ({adminInfo?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b" style={{ borderColor: "var(--card-border)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: BarChart3 },
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "dashboard" && stats && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Utilisateurs totaux"
                value={stats.totalUsers}
                subtitle={`${stats.activeUsers} actifs`}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Instances totales"
                value={stats.totalInstances}
                subtitle={`${stats.activeInstances} actives`}
                icon={Server}
                color="green"
              />
              <StatCard
                title="Instances connectées"
                value={stats.instancesByStatus?.open || 0}
                subtitle="WhatsApp actif"
                icon={Activity}
                color="purple"
              />
              <StatCard
                title="Taux d'activité"
                value={`${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`}
                subtitle="Utilisateurs actifs"
                icon={TrendingUp}
                color="orange"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Utilisateurs par plan</h3>
                <div className="space-y-3">
                  {Object.entries(stats.usersByPlan).map(([plan, count]) => (
                    <div key={plan}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 capitalize">{plan}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
                <h3 className="text-sm font-semibold text-white mb-4">Instances par statut</h3>
                <div className="space-y-3">
                  {Object.entries(stats.instancesByStatus).map(([status, count]) => (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 capitalize">{status}</span>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(count / stats.totalInstances) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Gestion des utilisateurs</h2>
              <span className="text-sm text-gray-400">{users.length} utilisateurs</span>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <table className="w-full">
                <thead style={{ background: "var(--input-bg)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Instances max</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Créé le</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {users.map((user) => (
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
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleUserStatus(user._id)}
                            className="p-1.5 rounded hover:bg-gray-700 transition-colors"
                            title={user.isActive ? "Désactiver" : "Activer"}
                          >
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
              <span className="text-sm text-gray-400">{instances.length} instances</span>
            </div>

            <div className="overflow-hidden rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
              <table className="w-full">
                <thead style={{ background: "var(--input-bg)" }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Instance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Créé le</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--card-border)" }}>
                  {instances.map((instance) => (
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
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(instance.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => deleteInstance(instance._id)}
                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                            title="Supprimer"
                          >
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

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: any;
  color: string;
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
    orange: "bg-orange-500/10 text-orange-400",
  };

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors[color as keyof typeof colors]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-xs font-medium text-gray-400">{title}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
