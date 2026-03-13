"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DataPoint[];
  title: string;
  height?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function DonutChart({ 
  data, 
  title, 
  height = 300,
  showLegend = true,
  centerLabel,
  centerValue
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-lg shadow-lg border" style={{ 
          background: "var(--card-bg)", 
          borderColor: "var(--card-border)" 
        }}>
          <p className="text-xs text-gray-400 mb-1">{payload[0].name}</p>
          <p className="text-sm font-semibold text-white">
            {payload[0].value} ({((payload[0].value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percent = (entry.value / total) * 100;
    return percent > 5 ? `${percent.toFixed(0)}%` : '';
  };

  const CustomizedLabel = ({ cx, cy }: any) => {
    return (
      <text x={cx} y={cy - 10} fill="white" textAnchor="middle" dominantBaseline="central">
        <tspan className="text-2xl font-bold">{centerValue || total}</tspan>
        {centerLabel && <tspan x={cx} y={cy + 15} className="text-xs text-gray-400">{centerLabel}</tspan>}
      </text>
    );
  };

  return (
    <div className="p-6 rounded-xl" style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}>
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            innerRadius={centerLabel || centerValue ? 60 : 40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span style={{ color: '#9ca3af' }}>{value}</span>
              )}
            />
          )}
          {(centerLabel || centerValue) && <CustomizedLabel />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
