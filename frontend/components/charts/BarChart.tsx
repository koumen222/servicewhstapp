"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  color?: string;
  trend?: number;
}

interface AdvancedBarChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
  showTrend?: boolean;
  formatValue?: (value: number) => string;
}

export function AdvancedBarChart({ 
  data, 
  title, 
  height = 300,
  showTrend = false,
  formatValue = (v) => v.toString()
}: AdvancedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ 
          background: "var(--card-bg)", 
          borderColor: "var(--card-border)" 
        }}>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-sm font-semibold text-white mb-1">
            {formatValue(payload[0].value)}
          </p>
          {showTrend && data.trend && (
            <p className={`text-xs ${data.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.trend > 0 ? '↑' : '↓'} {Math.abs(data.trend)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const getBarColor = (value: number, index: number) => {
    if (data[index]?.color) return data[index].color;
    if (showTrend && data[index]?.trend) {
      return data[index].trend > 0 ? '#22c55e' : '#ef4444';
    }
    return '#3b82f6';
  };

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {showTrend && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-gray-400">Positif</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-gray-400">Négatif</span>
            </div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={formatValue}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.value, index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
