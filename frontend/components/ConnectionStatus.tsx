"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff, RotateCw, AlertCircle, CheckCircle } from "lucide-react";
import type { ConnectionStatus } from "@/lib/types";

interface ConnectionStatusProps {
  status: ConnectionStatus;
  instanceName: string;
  profileName?: string;
  className?: string;
  showInstanceName?: boolean;
}

const STATUS_CONFIG = {
  connected: {
    icon: CheckCircle,
    color: "#22c55e",
    bgColor: "#0d2510",
    text: "Connecté",
    description: "WhatsApp est actif et prêt",
  },
  disconnected: {
    icon: WifiOff,
    color: "#ef4444",
    bgColor: "#2d0d0d",
    text: "Déconnecté", 
    description: "WhatsApp n'est pas connecté",
  },
  connecting: {
    icon: RotateCw,
    color: "#f59e0b",
    bgColor: "#2d1f0d",
    text: "Connexion...",
    description: "Établissement de la connexion WhatsApp",
  },
  expired: {
    icon: AlertCircle,
    color: "#f59e0b",
    bgColor: "#2d1f0d", 
    text: "Session expirée",
    description: "Veuillez scanner le code QR pour vous reconnecter",
  },
  unknown: {
    icon: AlertCircle,
    color: "#6b7280",
    bgColor: "#1a1a1a",
    text: "Inconnu",
    description: "Impossible de déterminer le statut",
  },
};

export function ConnectionStatus({
  status,
  instanceName,
  profileName,
  className = "",
  showInstanceName = true,
}: ConnectionStatusProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl p-3 border ${className}`}
      style={{ 
        background: config.bgColor, 
        borderColor: `${config.color}40`,
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${config.color}20` }}
        >
          <Icon 
            size={15} 
            className={status === "connecting" ? "animate-spin" : ""}
            style={{ color: config.color }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full shrink-0 ${status === "connecting" ? "animate-pulse" : ""}`}
              style={{ background: config.color }}
            />
            <span className="text-[12px] font-semibold" style={{ color: config.color }}>
              {config.text}
            </span>
            {showInstanceName && (
              <span className="text-[11px] text-white/50 truncate">
                — {profileName || instanceName}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/50 mt-0.5">{config.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
