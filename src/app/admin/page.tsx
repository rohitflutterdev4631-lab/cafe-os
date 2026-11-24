'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  CreditCard,
  Receipt,
  TrendingUp,
  UserPlus,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SkeletonMetric, SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'signups'>('revenue');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchDashboardData = () => {
    fetch('/api/v1/admin/dashboard')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApprove = async (cafeId: string, cafeName: string) => {
    setApprovingId(cafeId);
    try {
      const res = await fetch(`/api/v1/admin/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (res.ok) {
        success('Cafe Approved', `${cafeName} is now active and published.`);
        fetchDashboardData();
      } else {
        error('Approval Failed', 'Unable to update cafe status.');
      }
    } catch {
      error('Network Error', 'Check connection to backend.');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
          <SkeletonMetric />
        </div>
        <SkeletonTable rows={4} cols={4} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const recentCafes = data?.recentCafes || [];
  const recentOrders = data?.recentOrders || [];
  const monthlyData = data?.monthlyData || [
    { month: 'Jun', signups: 4, revenue: 1996 },
    { month: 'Jul', signups: 7, revenue: 3493 },
    { month: 'Aug', signups: 11, revenue: 5489 },
    { month: 'Sep', signups: 16, revenue: 7984 },
    { month: 'Oct', signups: 22, revenue: 10978 },
    { month: 'Nov', signups: 28, revenue: 14970 },
  ];

  // Find pending cafes needing review
  const pendingCafesList = recentCafes.filter((c: any) => c.status === 'PENDING_APPROVAL');

  const maxVal = Math.max(
    ...monthlyData.map((d: any) => (chartMetric === 'revenue' ? d.revenue : d.signups)),
    10
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Platform Governance & Telemetry
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Operations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time business telemetry, multi-tenant billing, and platform throughput.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/onboarding"
            className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-purple-700 transition flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Assisted Cafe Setup
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Cafes
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">{stats.totalCafes || 0}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              {stats.activeCafes || 0} Active
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats.pendingCafes || 0} pending review</span>
            <span>{stats.suspendedCafes || 0} suspended</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Recurring Rev
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatCurrency(stats.mrr || 0)}
            </span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
              {stats.totalSubscriptions || 0} Subscriptions
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 text-emerald-600 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last billing cycle
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Customer Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.totalOrders || 0}
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Dine-in and takeaway volume</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Platform GMV
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900">
              {formatCurrency(stats.platformGmv || 0)}
            </span>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              Processed
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">Gross customer restaurant billing</div>
        </div>
      </div>

      {/* Pending Approvals Callout (If any) */}
      {pendingCafesList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Pending Cafe Registrations Awaiting Verification ({pendingCafesList.length})</span>
            </div>
            <Link
              href="/admin/cafes"
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline"
            >
              Manage in Cafes List
            </Link>
          </div>
          <div className="divide-y divide-amber-200/60">
            {pendingCafesList.map((c: any) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm text-slate-900">{c.name}</div>
                  <div className="text-xs text-slate-600">
                    Owner: {c.owner?.name} ({c.owner?.email})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickApprove(c.id, c.name)}
                    disabled={approvingId === c.id}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {approvingId === c.id ? 'Approving...' : 'Approve Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue & Growth Chart Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Platform Growth & Revenue Trends</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical monthly trends for tenant onboarding and subscription revenue.
            </p>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg transition ${
                chartMetric === 'revenue'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Subscription Revenue
            </button>
            <button
              onClick={() => setChartMetric('signups')}
              className={`px-3 py-1.5 rounded-lg transition ${
                chartMetric === 'signups'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cafe Signups
            </button>
          </div>
        </div>

        {/* SVG Bar Chart with Tooltips */}
        <div className="pt-6">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 px-2">
            {monthlyData.map((d: any, idx: number) => {
              const val = chartMetric === 'revenue' ? d.revenue : d.signups;
              const heightPct = Math.max(12, Math.round((val / maxVal) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-10">
                    {chartMetric === 'revenue' ? formatCurrency(val) : `${val} Cafes`}
                  </div>
                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-purple-50 rounded-t-xl overflow-hidden flex flex-col justify-end h-44">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        idx === monthlyData.length - 1
                          ? 'bg-purple-600 group-hover:bg-purple-700'
                          : 'bg-purple-400 group-hover:bg-purple-500'
                      }`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-xs font-semibold text-slate-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grids: Recent Cafes & Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cafes List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-base text-slate-900">Recently Registered Cafes</div>
            <Link
              href="/admin/cafes"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              View all cafes <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCafes.map((c: any) => {
              const activePlan = c.subscriptions?.[0]?.plan?.name || 'Free';
              return (
                <div
                  key={c.id}
                  className="p-4 hover:bg-slate-50/60 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate flex items-center gap-2">
                        {c.name}
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          {activePlan}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        Owner: {c.owner?.name} ({c.owner?.email})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                    <Link
                      href={`/c/${c.slug}`}
                      target="_blank"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Preview Digital Menu"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders Across Platform */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="font-bold text-base text-slate-900">Platform Activity</div>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Orders
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[380px]">
            {recentOrders.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No orders recorded yet.</div>
            ) : (
              recentOrders.map((ord: any) => (
                <div key={ord.id} className="p-4 hover:bg-slate-50/60 transition text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{ord.orderNumber}</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(ord.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{ord.cafe?.name}</span>
                    <span
                      className={`font-semibold ${
                        ord.status === 'COMPLETED'
                          ? 'text-emerald-600'
                          : ord.status === 'PREPARING'
                          ? 'text-amber-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
