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
    text: "Connected",
    description: "WhatsApp is active and ready",
  },
  disconnected: {
    icon: WifiOff,
    color: "#ef4444",
    bgColor: "#2d0d0d",
    text: "Disconnected", 
    description: "WhatsApp is not connected",
  },
  connecting: {
    icon: RotateCw,
    color: "#f59e0b",
    bgColor: "#2d1f0d",
    text: "Connecting...",
    description: "Establishing WhatsApp connection",
  },
  expired: {
    icon: AlertCircle,
    color: "#f59e0b",
    bgColor: "#2d1f0d", 
    text: "Session Expired",
    description: "Please scan QR code to reconnect",
  },
  unknown: {
    icon: AlertCircle,
    color: "#6b7280",
    bgColor: "#1a1a1a",
    text: "Unknown",
    description: "Unable to determine status",
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
      className={`rounded-xl p-4 border ${className}`}
      style={{ 
        background: config.bgColor, 
        borderColor: `${config.color}40`,
      }}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: `${config.color}20` }}
        >
          <Icon 
            size={18} 
            className={status === "connecting" ? "animate-spin" : ""}
            style={{ color: config.color }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ background: config.color }}
            />
            <span 
              className="text-sm font-semibold"
              style={{ color: config.color }}
            >
              {config.text}
            </span>
          </div>
          
          {showInstanceName && (
            <p className="text-xs text-white/90 mb-0.5">
              {profileName ? `${profileName} (${instanceName})` : instanceName}
            </p>
          )}
          
          <p className="text-[11px] text-white/60">
            {config.description}
          </p>
        </div>
      </div>
      
      {/* Pulse animation for connecting status */}
      {status === "connecting" && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{ borderColor: config.color }}
          animate={{ 
            opacity: [0.5, 0.2, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
}
