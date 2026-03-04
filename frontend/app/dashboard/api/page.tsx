"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Key,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  CheckCircle2,
  Code2,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "@/store/useStore";
import { formatDate } from "@/lib/utils";

const CODE_EXAMPLE = `// Send a message via WhatsApp SaaS API
const response = await fetch(
  'https://api.yourdomain.com/api/v1/message/sendText',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      instanceName: 'your-instance-name',
      remoteJid: '15551234567@s.whatsapp.net',
      message: { text: 'Hello from the API!' }
    })
  }
);`;

export default function ApiPage() {
  const { instances } = useAppStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  const allKeys = instances.flatMap((inst) =>
    (inst.apiKeys ?? []).map((k) => ({ ...k, instanceName: inst.name }))
  );

  return (
    <div className="max-w-4xl space-y-5">
      {/* Intro */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#0d2510" }}
          >
            <Code2 size={18} className="text-[#22c55e]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[14px] font-semibold text-white mb-1">
              REST API Access
            </h2>
            <p className="text-[12px] text-[#5a7a5a]">
              Use API keys to authenticate requests to the WhatsApp SaaS API.
              Each instance has its own set of keys with configurable permissions.
            </p>
          </div>
          <a
            href="https://green-api.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost text-xs flex items-center gap-1.5 shrink-0"
          >
            <ExternalLink size={12} /> Docs
          </a>
        </div>
      </motion.div>

      {/* API Keys */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <h3 className="text-[13px] font-semibold text-white flex items-center gap-2">
            <Key size={14} className="text-[#22c55e]" />
            API Keys
            <span className="text-[11px] text-[#4a6a4a] font-normal">
              ({allKeys.length})
            </span>
          </h3>
          <button className="btn-green text-xs flex items-center gap-1.5 px-3 py-1.5">
            <Plus size={12} />
            New key
          </button>
        </div>

        {allKeys.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[13px] text-[#5a7a5a]">
              No API keys yet. Create an instance first to generate API keys.
            </p>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Instance</th>
                <th className="text-left">Key</th>
                <th className="text-left">Permissions</th>
                <th className="text-left">Used</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {allKeys.map((k) => (
                <tr key={k.id}>
                  <td className="font-medium text-white">{k.name}</td>
                  <td>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#0d2510] text-[#22c55e]">
                      {k.instanceName}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-[#5a7a5a]">
                        {showKeys[k.id]
                          ? k.keyPrefix + "…"
                          : k.keyPrefix.slice(0, 8) + "••••••••"}
                      </span>
                      <button
                        onClick={() =>
                          setShowKeys((p) => ({ ...p, [k.id]: !p[k.id] }))
                        }
                        className="text-[#3a5a3a] hover:text-white"
                      >
                        {showKeys[k.id] ? (
                          <EyeOff size={11} />
                        ) : (
                          <Eye size={11} />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(k.keyPrefix, k.id + "-copy")}
                        className="text-[#3a5a3a] hover:text-[#22c55e]"
                      >
                        {copied === k.id + "-copy" ? (
                          <CheckCircle2 size={11} className="text-[#22c55e]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(k.permissions ?? []).slice(0, 2).map((p) => (
                        <span
                          key={p}
                          className="px-1 py-0.5 rounded text-[9px] bg-[#1a1a1a] text-[#6a8a6a]"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="text-[#5a7a5a]">{k.usageCount ?? 0}×</td>
                  <td>
                    <button className="text-[#3a5a3a] hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Code example */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <h3 className="text-[13px] font-semibold text-white">
            Quick Start — JavaScript
          </h3>
          <button
            onClick={() => copyText(CODE_EXAMPLE, "code")}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            {copied === "code" ? (
              <>
                <CheckCircle2 size={12} className="text-[#22c55e]" /> Copied
              </>
            ) : (
              <>
                <Copy size={12} /> Copy
              </>
            )}
          </button>
        </div>
        <pre
          className="px-5 py-4 text-[11px] font-mono overflow-x-auto text-[#8adc8a] leading-relaxed"
          style={{ background: "#080808" }}
        >
          {CODE_EXAMPLE}
        </pre>
      </motion.div>
    </div>
  );
}
