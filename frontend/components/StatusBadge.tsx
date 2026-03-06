"use client";

import { cn } from "@/lib/utils";
import type { InstanceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: InstanceStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  InstanceStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  open: {
    label: "Connected",
    dot: "bg-green-500",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  connected: {
    label: "Connected",
    dot: "bg-green-500",
    bg: "bg-green-500/10",
    text: "text-green-400",
  },
  connecting: {
    label: "Connecting",
    dot: "bg-yellow-500 animate-pulse",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
  },
  close: {
    label: "Disconnected",
    dot: "bg-gray-500",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-gray-500",
    bg: "bg-gray-500/10",
    text: "text-gray-400",
  },
  expired: {
    label: "Expired",
    dot: "bg-red-500",
    bg: "bg-red-500/10",
    text: "text-red-400",
  },
  unknown: {
    label: "Unknown",
    dot: "bg-gray-600",
    bg: "bg-gray-600/10",
    text: "text-gray-500",
  },
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.unknown;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          config.dot,
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"
        )}
      />
      {config.label}
    </span>
  );
}
