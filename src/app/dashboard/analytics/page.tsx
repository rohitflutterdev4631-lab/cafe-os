'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  QrCode,
  Calendar,
  Loader2,
  Sparkles,
  DollarSign,
  Coffee,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/analytics/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const revenueTrend = data?.revenueTrend || [];
  const popularItems = data?.popularItems || [];

  return (
    <div className="space-y-8 text-stone-100">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> CAFE OS Executive Business Intelligence
        </div>
        <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Sales Analytics & Telemetry</h1>
        <p className="text-sm text-stone-400 mt-1">
          Detailed sales breakdown, item velocity, recipe margins, and QR code customer engagement.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Today's Gross Sales</span>
          <div className="mt-2 text-3xl font-extrabold text-stone-100 font-mono">
            {formatCurrency(stats.todayRevenue || 0)}
          </div>
          <p className="text-xs text-emerald-400 font-medium mt-1 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live from verified orders
          </p>
        </div>

        <div className="bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Average Order Value (AOV)</span>
          <div className="mt-2 text-3xl font-extrabold text-amber-400 font-mono">
            {formatCurrency(
              stats.completedOrders > 0
                ? Math.round(stats.todayRevenue / stats.completedOrders)
                : 380
            )}
          </div>
          <p className="text-xs text-stone-400 font-medium mt-1">Per dining customer session</p>
        </div>

        <div className="bg-stone-900/90 p-5 rounded-2xl border border-stone-800 shadow-xl">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Total Customer QR Scans</span>
          <div className="mt-2 text-3xl font-extrabold text-stone-100 font-mono">
            {stats.totalQrScans || 0}
          </div>
          <p className="text-xs text-amber-300 font-medium mt-1">Unique digital menu sessions</p>
        </div>
      </div>

      {/* 7-Day Revenue Trend Graph Representation */}
      <div className="bg-stone-900/90 p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-sm sm:text-base text-stone-100">Weekly Revenue Breakdown</h2>
          <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Last 7 Days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-3 pt-6 items-end h-48 border-b border-stone-800 pb-4">
          {revenueTrend.map((day: any) => {
            const heightPercent = Math.min(100, Math.max(20, (day.revenue / 3500) * 100));
            return (
              <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-bold text-amber-300 font-mono opacity-0 group-hover:opacity-100 transition">
                  {formatCurrency(day.revenue)}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-amber-700 to-amber-500 group-hover:from-amber-600 group-hover:to-amber-400 rounded-t-xl transition-all shadow-md shadow-amber-950/50"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-semibold text-stone-400 truncate w-full text-center">
                  {day.date.split(',')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Dishes Performance */}
      <div className="bg-stone-900/90 p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
        <h2 className="font-extrabold text-base text-stone-100">Top Performing Menu Items</h2>
        <div className="divide-y divide-stone-800 text-sm">
          {popularItems.map((it: any, i: number) => (
            <div key={it.name} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center font-mono border border-amber-500/30">
                  {i + 1}
                </span>
                <span className="font-semibold text-stone-200">{it.name}</span>
              </div>
              <div className="text-xs font-bold text-stone-300 font-mono">
                {it.totalSold} portions prepared
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
