"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key, Copy, Plus, Trash2, CheckCircle2, Code2, Loader2,
  AlertTriangle, X, Shield,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { apiKeysApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ALL_PERMISSIONS = [
  { id: "send_message",        label: "send_message" },
  { id: "get_instance_status", label: "get_instance_status" },
  { id: "manage_webhooks",     label: "manage_webhooks" },
  { id: "read_messages",       label: "read_messages" },
];

interface LiveKey {
  id: string;
  name: string | null;
  keyPrefix: string;
  permissions: string[];
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  instance: { id: string; customName: string; instanceName: string };
}

export default function ApiPage() {
  const { instances } = useAppStore();

  const [keys, setKeys]             = useState<LiveKey[]>([]);
  const [loading, setLoading]       = useState(true);
  const [copied, setCopied]         = useState<string | null>(null);
  const [revoking, setRevoking]     = useState<string | null>(null);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName]       = useState("");
  const [newInstance, setNewInstance] = useState("");
  const [newPerms, setNewPerms]     = useState<string[]>(["send_message", "get_instance_status"]);
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // Session map: keyId → full key (cleared on page refresh)
  const [sessionKeys, setSessionKeys] = useState<Record<string, string>>({});
  const [regenerating, setRegenerating] = useState<string | null>(null);

  // Revealed key (shown once after creation)
  const [revealedKey, setRevealedKey] = useState<{ key: string; name: string } | null>(null);

  const loadKeys = useCallback(async () => {
    try {
      const res = await apiKeysApi.getAll();
      setKeys(res.data?.data ?? []);
    } catch {
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleCreate() {
    if (!newInstance) { setCreateError("Sélectionnez une instance"); return; }
    if (newPerms.length === 0) { setCreateError("Sélectionnez au moins une permission"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await apiKeysApi.create(newInstance, newName || undefined, newPerms);
      const created = res.data?.data;
      setRevealedKey({ key: created.key, name: created.name ?? "API Key" });
      setSessionKeys((prev) => ({ ...prev, [created.id]: created.key }));
      setShowCreate(false);
      setNewName(""); setNewInstance(""); setNewPerms(["send_message", "get_instance_status"]);
      await loadKeys();
    } catch (e: any) {
      setCreateError(e?.response?.data?.error ?? "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevoking(id);
    try {
      await apiKeysApi.revoke(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setSessionKeys((prev) => { const n = { ...prev }; delete n[id]; return n; });
    } catch {/* silent */} finally {
      setRevoking(null);
    }
  }

  async function handleRegenerate(k: LiveKey) {
    setRegenerating(k.id);
    try {
      const res = await apiKeysApi.create(
        k.instance.id,
        k.name ?? undefined,
        k.permissions
      );
      const created = res.data?.data;
      // revoke old key
      await apiKeysApi.revoke(k.id);
      setRevealedKey({ key: created.key, name: created.name ?? "API Key" });
      setSessionKeys((prev) => {
        const n = { ...prev };
        delete n[k.id];
        n[created.id] = created.key;
        return n;
      });
      await loadKeys();
    } catch {/* silent */} finally {
      setRegenerating(null);
    }
  }

  const codeExample = `// Envoyer un message via WhatsApp SaaS API
const response = await fetch(
  '${API_BASE}/api/v1/send-message',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      number: '237612345678',
      text: 'Bonjour depuis l\\'API !'
    })
  }
);
const data = await response.json();
console.log(data.data.messageId);`;

  return (
    <div className="w-full max-w-4xl space-y-5">

      {/* Intro */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0d2510" }}>
            <Code2 size={18} className="text-[#22c55e]" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-white mb-0.5">Accès API REST</h2>
            <p className="text-[12px] text-[#5a7a5a]">
              Utilisez des clés API pour authentifier vos requêtes. Chaque instance possède ses propres clés avec des permissions configurables.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Revealed key banner — shown once after creation */}
      <AnimatePresence>
        {revealedKey && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl p-4" style={{ background: "#071a0e", border: "1px solid #22c55e60" }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#22c55e] flex items-center gap-1.5 mb-1">
                  <Shield size={12} /> Clé créée — copiez-la maintenant, elle ne sera plus affichée
                </p>
                <p className="text-[11px] text-[#5a7a5a] mb-2">{revealedKey.name}</p>
                <div className="flex items-center gap-2 bg-[#0a0a0a] rounded-xl px-3 py-2 font-mono text-[12px] text-[#22c55e]">
                  <span className="truncate">{revealedKey.key}</span>
                  <button onClick={() => copyText(revealedKey.key, "revealed")} className="shrink-0 text-[#3a7a3a] hover:text-[#22c55e]">
                    {copied === "revealed" ? <CheckCircle2 size={13} className="text-[#22c55e]" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <button onClick={() => setRevealedKey(null)} className="text-[#3a5a3a] hover:text-white shrink-0 mt-0.5">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Keys table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#1a1a1a] flex-wrap">
          <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
            <Key size={14} className="text-[#22c55e]" />
            Clés API
            <span className="text-[11px] text-[#4a6a4a] font-normal">({keys.length})</span>
          </h3>
          <button onClick={() => setShowCreate(true)} className="btn-green text-xs flex items-center gap-1.5 px-3 py-1.5">
            <Plus size={12} /> Nouvelle clé
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={18} className="animate-spin text-[#22c55e]" />
          </div>
        ) : keys.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Key size={24} className="text-[#2a3a2a] mx-auto mb-2" />
            <p className="text-[13px] text-[#5a7a5a]">Aucune clé API. Créez une instance puis générez une clé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full data-table min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left">Nom</th>
                <th className="text-left">Instance</th>
                <th className="text-left">Clé (préfixe)</th>
                <th className="text-left">Permissions</th>
                <th className="text-left">Utilisations</th>
                <th className="text-left">Créée le</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="font-medium text-white">{k.name ?? "—"}</td>
                  <td>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0d2510] text-[#22c55e]">
                      {k.instance?.customName ?? "—"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      {sessionKeys[k.id] ? (
                        // Full key available this session
                        <>
                          <span className="text-[#22c55e]">{sessionKeys[k.id]}</span>
                          <button onClick={() => copyText(sessionKeys[k.id], k.id + "-copy")} className="text-[#3a7a3a] hover:text-[#22c55e] shrink-0">
                            {copied === k.id + "-copy" ? <CheckCircle2 size={10} className="text-[#22c55e]" /> : <Copy size={10} />}
                          </button>
                        </>
                      ) : (
                        // Only prefix stored — key gone after session
                        <span className="text-[#4a6a4a]">
                          {k.keyPrefix.replace(/\.\.\.?$/, "")}••••••••
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(k.permissions ?? []).map((p) => (
                        <span key={p} className="px-1 py-0.5 rounded text-[9px] bg-[#1a1a1a] text-[#6a8a6a]">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="text-[#5a7a5a]">{k.usageCount ?? 0}×</td>
                  <td className="text-[#5a7a5a] text-[11px]">{formatDate(k.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegenerate(k)}
                        disabled={regenerating === k.id || revoking === k.id}
                        className="text-[11px] text-[#3a5a3a] hover:text-[#22c55e] transition-colors disabled:opacity-40 font-mono"
                        title="Régénérer (révoque l'ancienne clé)"
                      >
                        {regenerating === k.id ? <Loader2 size={11} className="animate-spin" /> : "↻"}
                      </button>
                      <button
                        onClick={() => handleRevoke(k.id)}
                        disabled={revoking === k.id || regenerating === k.id}
                        className="text-[#3a5a3a] hover:text-red-400 transition-colors disabled:opacity-40"
                      >
                        {revoking === k.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </motion.div>

      {/* Code example */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <h3 className="text-[13px] font-semibold text-white">Quick Start — JavaScript</h3>
          <button onClick={() => copyText(codeExample, "code")} className="btn-ghost text-xs flex items-center gap-1.5">
            {copied === "code" ? <><CheckCircle2 size={12} className="text-[#22c55e]" /> Copié</> : <><Copy size={12} /> Copier</>}
          </button>
        </div>
        <pre className="px-4 sm:px-5 py-4 text-[11px] font-mono overflow-x-auto text-[#8adc8a] leading-relaxed whitespace-pre" style={{ background: "#080808" }}>
          {codeExample}
        </pre>
      </motion.div>

      {/* Create key modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-md"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-semibold text-white flex items-center gap-2">
                  <Key size={14} className="text-[#22c55e]" /> Nouvelle clé API
                </h3>
                <button onClick={() => setShowCreate(false)} className="text-[#3a5a3a] hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-[11px] text-[#8a9a8a] block mb-1">Nom (optionnel)</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ex: Clé de Production"
                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-[12px] text-white placeholder-[#3a5a3a] focus:border-[#22c55e] focus:outline-none"
                  />
                </div>

                {/* Instance */}
                <div>
                  <label className="text-[11px] text-[#8a9a8a] block mb-1">Instance *</label>
                  <select
                    value={newInstance}
                    onChange={(e) => setNewInstance(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-3 py-2 text-[12px] text-white focus:border-[#22c55e] focus:outline-none"
                  >
                    <option value="">— Sélectionner —</option>
                    {instances.map((inst) => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div>
                  <label className="text-[11px] text-[#8a9a8a] block mb-2">Permissions *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_PERMISSIONS.map(({ id, label }) => (
                      <label key={id}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                        style={{
                          background: newPerms.includes(id) ? "#0d2510" : "#0a0a0a",
                          border: `1px solid ${newPerms.includes(id) ? "#22c55e40" : "#1a1a1a"}`,
                        }}
                      >
                        <input type="checkbox" checked={newPerms.includes(id)}
                          onChange={(e) => setNewPerms(e.target.checked ? [...newPerms, id] : newPerms.filter(p => p !== id))}
                          className="accent-[#22c55e]" />
                        <span className="text-[10px] font-mono" style={{ color: newPerms.includes(id) ? "#22c55e" : "#5a7a5a" }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {createError && (
                  <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-950/30 rounded-xl px-3 py-2">
                    <AlertTriangle size={12} /> {createError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1 py-2 text-xs">Annuler</button>
                  <button onClick={handleCreate} disabled={creating} className="btn-green flex-1 py-2 text-xs flex items-center justify-center gap-1.5">
                    {creating ? <><Loader2 size={12} className="animate-spin" /> Création…</> : <><Key size={12} /> Générer</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
