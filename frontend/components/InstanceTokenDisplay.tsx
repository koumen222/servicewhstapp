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
  const [showToken, setShowToken] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyToken() {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1f0d] border border-[#1a2e1a]">
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
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
          <Key size={13} className="text-[#22c55e] shrink-0" />
          <code className="flex-1 text-[11px] font-mono text-[#22c55e] truncate select-all">
            {showToken ? token : "•".repeat(Math.min(token.length, 48))}
          </code>
          <button
            onClick={() => setShowToken(!showToken)}
            className="text-[#4a6a4a] hover:text-white transition-colors shrink-0"
            title={showToken ? "Masquer le token" : "Afficher le token"}
          >
            {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button
            onClick={copyToken}
            className="text-[#4a6a4a] hover:text-[#22c55e] transition-colors shrink-0"
            title="Copier le token"
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

      <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e]">
        <p className="text-[10px] font-medium text-[#8a9a8a] mb-2">Exemple d'utilisation (cURL)</p>
        <pre className="text-[9px] font-mono text-[#5a7a5a] overflow-x-auto whitespace-pre-wrap break-all">
{`curl -X POST https://api.example.com/api/v1/send-message \\
  -H "Authorization: Instance-Token ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipient": "+237XXXXXXXXX",
    "message": "Hello from WhatsApp!"
  }'`}
        </pre>
      </div>
    </div>
  );
}
