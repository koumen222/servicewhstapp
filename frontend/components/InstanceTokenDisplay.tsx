"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Eye, EyeOff, CheckCircle2, Key, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstanceTokenDisplayProps {
  token: string;
  instanceName: string;
  className?: string;
}

export function InstanceTokenDisplay({ token, instanceName, className }: InstanceTokenDisplayProps) {
  const [showToken, setShowToken] = useState(true);
  const [copied, setCopied] = useState(false);
  const hasToken = token && token.length > 0;

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--green-bg-subtle)', border: '1px solid var(--green-border-subtle)' }}>
        <AlertCircle size={14} className="text-[#22c55e] mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[#6a9a6a] leading-relaxed">
            <strong className="text-[#22c55e]">Token d'instance</strong> — Utilisez ce token pour authentifier vos appels API externes.
            Conservez-le en lieu sûr.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#8a9a8a] mb-1.5">
          Token d'authentification
        </label>
        <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          <Key size={13} className={cn(hasToken ? "text-[#22c55e]" : "text-[#3a5a3a]", "shrink-0")} />
          <code className={cn("flex-1 text-[11px] font-mono truncate select-all", hasToken ? "text-[#22c55e]" : "text-[#3a5a3a]")}>
            {hasToken ? (showToken ? token : "•".repeat(Math.min(token.length, 48))) : "Token non disponible"}
          </code>
          {hasToken && (
            <button
              onClick={() => setShowToken(!showToken)}
              className="text-[#4a6a4a] hover:text-white transition-colors shrink-0"
              title={showToken ? "Masquer le token" : "Afficher le token"}
            >
              {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
          <button
            onClick={copyToken}
            disabled={!hasToken}
            className={cn("transition-colors shrink-0", hasToken ? "text-[#4a6a4a] hover:text-[#22c55e]" : "text-[#2a3a2a] cursor-not-allowed")}
            title={hasToken ? "Copier le token" : "Token non disponible"}
          >
            {copied ? (
              <CheckCircle2 size={13} className="text-[#22c55e]" />
            ) : (
              <Copy size={13} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[#4a6a4a]">
          Ce token est unique à cette instance. Utilisez-le dans le header: <code className="text-[#6a9a6a]">Authorization: Instance-Token {"{token}"}</code>
        </p>
      </div>
    </div>
  );
}
