"use client";

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  format?: 'currency' | 'percentage' | 'number';
  isLoading?: boolean;
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  color = 'blue',
  format = 'number',
  isLoading = false
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('fr-FR', { 
          style: 'currency', 
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return new Intl.NumberFormat('fr-FR').format(val);
    }
  };

  const colors = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  const getTrendIcon = () => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp size={14} className="text-green-400" />;
      case 'decrease':
        return <TrendingDown size={14} className="text-red-400" />;
      default:
        return <Minus size={14} className="text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'decrease':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 rounded-xl animate-pulse" style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)" 
      }}>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300"
      style={{ 
        background: "var(--card-bg)", 
        border: "1px solid var(--card-border)" 
      }}
    >
      {/* Background gradient effect */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#f59e0b'} 0%, transparent 70%)`
        }}
      />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-400 mb-1">{title}</p>
            <p className="text-2xl font-bold text-white mb-1">
              {formatValue(value)}
            </p>
            {subtitle && (
              <p className="text-xs font-medium text-gray-500">{subtitle}</p>
            )}
          </div>
          
          {Icon && (
            <div className={`p-3 rounded-lg ${colors[color]}`}>
              <Icon size={20} />
            </div>
          )}
        </div>

        {/* Trend indicator */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(change)}%</span>
            </div>
            <span className="text-xs text-gray-500">vs période précédente</span>
          </div>
        )}

        {/* Sparkline placeholder */}
        <div className="mt-4 h-8 opacity-20">
          <svg viewBox="0 0 100 32" className="w-full h-full">
            <polyline
              fill="none"
              stroke={color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#f59e0b'}
              strokeWidth="2"
              points="0,25 20,20 40,28 60,15 80,18 100,10"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
