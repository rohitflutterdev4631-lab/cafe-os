'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardSubscriptionPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [interval, setInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/v1/subscriptions');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgradingPlan(planId);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingInterval: interval,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(json.message);
        fetchSubscription();
      }
    } finally {
      setUpgradingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const currentSub = data?.currentSubscription;
  const currentPlan = currentSub?.plan || { name: 'Free', itemLimit: 20, tableLimit: 5 };
  const usage = data?.usage || { items: 0, tables: 0, qrCodes: 0 };
  const availablePlans = data?.availablePlans || [];

  return (
    <div className="space-y-8 max-w-5xl text-stone-100">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> CAFE OS SaaS Subscriptions & Entitlements
        </div>
        <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Subscription & Limits</h1>
        <p className="text-sm text-stone-400 mt-1">
          Monitor your active feature entitlements, catalog limits, and subscription billing.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Active Plan Overview Card */}
      <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-100">{currentPlan.name} Plan</h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30">
                  {currentSub?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 font-mono">
                Billed {currentSub?.billingInterval?.toLowerCase() || 'monthly'} • Renews on{' '}
                {currentSub?.endDate ? formatDate(currentSub.endDate) : 'Lifetime Enterprise'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-amber-400 font-mono">
              {formatCurrency(
                currentSub?.billingInterval === 'YEARLY'
                  ? currentPlan.yearlyPrice || 0
                  : currentPlan.monthlyPrice || 0
              )}
            </div>
            <div className="text-xs text-stone-500">Current subscription tier</div>
          </div>
        </div>

        {/* Feature Usage Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
              <span className="text-stone-400">Food Items Used</span>
              <span className="text-stone-200">
                {usage.items} / {currentPlan.itemLimit}
              </span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (usage.items / currentPlan.itemLimit) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
              <span className="text-stone-400">Tables Configured</span>
              <span className="text-stone-200">
                {usage.tables} / {currentPlan.tableLimit}
              </span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (usage.tables / currentPlan.tableLimit) * 100)}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5 font-mono">
              <span className="text-stone-400">QR Codes Generated</span>
              <span className="text-stone-200">{usage.qrCodes} active</span>
            </div>
            <div className="w-full bg-stone-950 h-2.5 rounded-full overflow-hidden border border-stone-800">
              <div className="bg-emerald-500 h-full rounded-full w-2/3" />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-100">Upgrade or Change Plan</h2>
          <div className="flex items-center gap-2 bg-stone-900 border border-stone-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setInterval('MONTHLY')}
              className={`px-3 py-1 rounded-lg transition ${
                interval === 'MONTHLY' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('YEARLY')}
              className={`px-3 py-1 rounded-lg transition ${
                interval === 'YEARLY' ? 'bg-amber-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.map((plan: any) => {
            const isCurrent = currentPlan.name === plan.name;
            const price = interval === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`bg-stone-900/90 rounded-2xl border p-6 shadow-xl flex flex-col justify-between transition ${
                  isCurrent ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-stone-100">{plan.name}</h3>
                    {isCurrent && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 mt-1">{plan.description}</p>

                  <div className="mt-4 flex items-baseline">
                    <span className="text-3xl font-extrabold text-stone-100 font-mono">
                      {formatCurrency(price)}
                    </span>
                    <span className="text-xs text-stone-500 ml-1">
                      /{interval === 'YEARLY' ? 'yr' : 'mo'}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-stone-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Up to {plan.itemLimit} Food Items</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Up to {plan.tableLimit} Dining Tables</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{plan.hasOnlineOrdering ? 'Live Online Ordering' : 'Digital Menu Only'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{plan.hasCustomBranding ? 'Custom Theme Branding' : 'Default Theme'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Kitchen Display KDS ({plan.hasKds ? 'Included' : 'No'})</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || upgradingPlan === plan.id}
                  className={`mt-6 w-full py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                    isCurrent
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950/40'
                  }`}
                >
                  {upgradingPlan === plan.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isCurrent ? (
                    'Active Plan'
                  ) : (
                    'Switch to this Plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
