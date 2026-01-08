/**
 * Dashboard Charts Component
 * Visualization of portfolio analytics and trends
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, PieChart, BarChart3 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface TrendData {
  date: string;
  value: number;
}

interface DashboardChartsProps {
  consolidationHistory?: TrendData[];
  portfolioByChain?: ChartData[];
  gasMetrics?: {
    totalSaved: number;
    thisMonth: number;
    trend: number;
  };
  riskDistribution?: ChartData[];
}

// Simple Bar Chart Component (No external deps)
function MiniBarChart({ data, height = 120 }: { data: ChartData[]; height?: number }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 justify-around" style={{ height }}>
      {data.map((item, i) => (
        <div key={item.label} className="flex flex-col items-center gap-1 flex-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(item.value / maxValue) * 100}%` }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={cn("w-full max-w-8 rounded-t-lg", item.color)}
            style={{ minHeight: 4 }}
          />
          <span className="text-[10px] text-slate-500 truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Donut Chart Component
function MiniDonutChart({ data, size = 100 }: { data: ChartData[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  const segments = data.map((item, i) => {
    const angle = total > 0 ? (item.value / total) * 360 : 0;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...item,
      startAngle,
      endAngle: currentAngle,
    };
  });

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.6;
  const center = size / 2;

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const startInner = polarToCartesian(center, center, innerRadius, endAngle);
    const endInner = polarToCartesian(center, center, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'L', endInner.x, endInner.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
      'Z'
    ].join(' ');
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {segments.map((seg, i) => (
          <motion.path
            key={seg.label}
            d={describeArc(seg.startAngle, seg.endAngle - 0.5)}
            fill={seg.color.includes('bg-') ? 
              seg.color.replace('bg-', '').includes('indigo') ? '#6366f1' :
              seg.color.replace('bg-', '').includes('emerald') ? '#10b981' :
              seg.color.replace('bg-', '').includes('amber') ? '#f59e0b' :
              seg.color.replace('bg-', '').includes('red') ? '#ef4444' :
              seg.color.replace('bg-', '').includes('blue') ? '#3b82f6' :
              seg.color.replace('bg-', '').includes('purple') ? '#8b5cf6' :
              seg.color.replace('bg-', '').includes('slate') ? '#64748b' :
              '#6366f1' : seg.color
            }
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-700">{data.length}</span>
      </div>
    </div>
  );
}

// Sparkline Chart
function Sparkline({ data, color = '#6366f1' }: { data: number[]; color?: string }) {
  const height = 40;
  const width = 120;
  const padding = 2;
  
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const trend = data.length > 1 ? data[data.length - 1] - data[0] : 0;

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className={cn(
        "flex items-center gap-0.5 text-xs font-medium",
        trend >= 0 ? 'text-emerald-600' : 'text-red-600'
      )}>
        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {Math.abs(trend).toFixed(1)}%
      </div>
    </div>
  );
}

export function DashboardCharts({
  consolidationHistory = [],
  portfolioByChain = [],
  gasMetrics = { totalSaved: 0, thisMonth: 0, trend: 0 },
  riskDistribution = [],
}: DashboardChartsProps) {
  // Default data if none provided
  const defaultChainData: ChartData[] = useMemo(() => [
    { label: 'Base', value: 45, color: 'bg-blue-500' },
    { label: 'ETH', value: 25, color: 'bg-slate-600' },
    { label: 'Arb', value: 15, color: 'bg-blue-400' },
    { label: 'OP', value: 10, color: 'bg-red-500' },
    { label: 'POL', value: 5, color: 'bg-purple-500' },
  ], []);

  const defaultRiskData: ChartData[] = useMemo(() => [
    { label: 'Legit', value: 40, color: 'bg-emerald-500' },
    { label: 'Dust', value: 35, color: 'bg-indigo-500' },
    { label: 'Micro', value: 15, color: 'bg-amber-500' },
    { label: 'Risk', value: 10, color: 'bg-red-500' },
  ], []);

  const sparklineData = useMemo(() => 
    consolidationHistory.length > 0 
      ? consolidationHistory.map(h => h.value) 
      : [12, 18, 15, 22, 28, 35, 42]
  , [consolidationHistory]);

  const chainData = portfolioByChain.length > 0 ? portfolioByChain : defaultChainData;
  const riskData = riskDistribution.length > 0 ? riskDistribution : defaultRiskData;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Gas Savings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="font-semibold text-slate-700">Gas Saved</span>
          </div>
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            gasMetrics.trend >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          )}>
            {gasMetrics.trend >= 0 ? '+' : ''}{gasMetrics.trend.toFixed(1)}%
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-2">
          ${gasMetrics.totalSaved.toFixed(2)}
        </div>
        <Sparkline data={sparklineData} color="#10b981" />
        <p className="text-xs text-slate-500 mt-2">
          ${gasMetrics.thisMonth.toFixed(2)} saved this month
        </p>
      </motion.div>

      {/* Portfolio by Chain */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-semibold text-slate-700">Portfolio by Chain</span>
        </div>
        <MiniBarChart data={chainData} height={100} />
      </motion.div>

      {/* Risk Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <PieChart className="w-4 h-4 text-amber-600" />
          </div>
          <span className="font-semibold text-slate-700">Token Classification</span>
        </div>
        <div className="flex items-center justify-between">
          <MiniDonutChart data={riskData} size={90} />
          <div className="flex-1 ml-4 space-y-1.5">
            {riskData.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", item.color)} />
                  <span className="text-slate-600">{item.label}</span>
                </div>
                <span className="font-medium text-slate-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DashboardCharts;
