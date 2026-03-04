"use client";

import { motion } from "framer-motion";
import { Globe, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

const MOCK_PROXIES = [
  { id: "1", host: "proxy.example.com", port: 8080, protocol: "http", status: "active" },
];

export default function ProxyPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5"
        style={{
          background: "linear-gradient(135deg, #0d1a2a, #050d14)",
          border: "1px solid #1a2a3a",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#3b82f620" }}
          >
            <Globe size={18} className="text-[#3b82f6]" />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-white mb-1">
              Proxy Configuration
            </h2>
            <p className="text-[12px] text-[#5a7a8a]">
              Route WhatsApp connections through proxies to bypass regional
              restrictions or improve reliability.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111", border: "1px solid #1e1e1e" }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1a1a1a]">
          <h3 className="text-[13px] font-semibold text-white">
            Configured Proxies
          </h3>
          <button className="btn-ghost text-xs flex items-center gap-1.5">
            <Plus size={12} /> Add proxy
          </button>
        </div>

        {MOCK_PROXIES.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-[12px] text-[#5a7a5a]">No proxies configured.</p>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Host</th>
                <th className="text-left">Port</th>
                <th className="text-left">Protocol</th>
                <th className="text-left">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {MOCK_PROXIES.map((proxy) => (
                <tr key={proxy.id}>
                  <td className="font-mono text-white">{proxy.host}</td>
                  <td className="font-mono text-[#5a7a5a]">{proxy.port}</td>
                  <td>
                    <span className="uppercase text-[10px] text-[#5a7a5a]">
                      {proxy.protocol}
                    </span>
                  </td>
                  <td>
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: proxy.status === "active" ? "#22c55e" : "#ef4444" }}
                    >
                      {proxy.status === "active" ? (
                        <CheckCircle2 size={11} />
                      ) : (
                        <AlertCircle size={11} />
                      )}
                      {proxy.status}
                    </span>
                  </td>
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
    </div>
  );
}
