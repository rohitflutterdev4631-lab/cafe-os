'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, Edit2, Loader2, Save, Sparkles, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/v1/admin/plans');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch {
      error('Error loading plans', 'Could not fetch subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openEditModal = (plan: any) => {
    setEditingPlan(plan);
    setEditForm({
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      itemLimit: plan.itemLimit,
      tableLimit: plan.tableLimit,
      branchLimit: plan.branchLimit,
      hasOnlineOrdering: plan.hasOnlineOrdering,
      hasCustomBranding: plan.hasCustomBranding,
    });
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/v1/admin/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlan.id,
          monthlyPrice: Number(editForm.monthlyPrice),
          yearlyPrice: Number(editForm.yearlyPrice),
          itemLimit: Number(editForm.itemLimit),
          tableLimit: Number(editForm.tableLimit),
          branchLimit: Number(editForm.branchLimit),
          hasOnlineOrdering: Boolean(editForm.hasOnlineOrdering),
          hasCustomBranding: Boolean(editForm.hasCustomBranding),
        }),
      });
      if (res.ok) {
        success('Plan Updated', `Entitlements for ${editingPlan.name} plan saved successfully.`);
        setEditingPlan(null);
        fetchPlans();
      } else {
        error('Save Failed', 'Could not update plan configuration.');
      }
    } catch {
      error('Network Error', 'Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Monetization & Entitlements
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          SaaS Subscription Plans
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Configure tier pricing, catalog limits, and feature gates enforced by backend business logic.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 h-96 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isPro = p.name === 'Pro';
            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                  isPro ? 'border-purple-300 ring-2 ring-purple-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">{p.name}</h2>
                      {isPro && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          POPULAR
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {p._count?.subscriptions || 0} active cafes
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">
                        {formatCurrency(p.monthlyPrice)}
                      </span>
                      <span className="text-xs text-slate-500">/month</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      or {formatCurrency(p.yearlyPrice)} billed annually
                    </div>

                    <ul className="mt-6 space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Up to <strong>{p.itemLimit}</strong> food items
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Up to <strong>{p.tableLimit}</strong> dining tables & QRs
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>{p.branchLimit}</strong> branch location
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Online ordering: <strong>{p.hasOnlineOrdering ? 'Enabled' : 'Disabled'}</strong>
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Custom branding: <strong>{p.hasCustomBranding ? 'Enabled' : 'Standard'}</strong>
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => openEditModal(p)}
                    className="w-full py-2 border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 rounded-xl text-xs font-semibold text-slate-700 hover:text-purple-700 flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Configure Entitlements
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title={`Edit ${editingPlan.name} Plan`}
          subtitle="Modify pricing and feature limits for this tier."
          maxWidth="max-w-lg"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <button
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Monthly Price (₹)</label>
                <input
                  type="number"
                  value={editForm.monthlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, monthlyPrice: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Yearly Price (₹)</label>
                <input
                  type="number"
                  value={editForm.yearlyPrice}
                  onChange={(e) => setEditForm({ ...editForm, yearlyPrice: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Max Food Items</label>
                <input
                  type="number"
                  value={editForm.itemLimit}
                  onChange={(e) => setEditForm({ ...editForm, itemLimit: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Max Dining Tables</label>
                <input
                  type="number"
                  value={editForm.tableLimit}
                  onChange={(e) => setEditForm({ ...editForm, tableLimit: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block">Feature Gates</label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.hasOnlineOrdering}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hasOnlineOrdering: e.target.checked })
                  }
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Enable Customer Online Ordering (Cart & Checkout)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.hasCustomBranding}
                  onChange={(e) =>
                    setEditForm({ ...editForm, hasCustomBranding: e.target.checked })
                  }
                  className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <span>Enable Custom Cafe Branding & Logo Removal</span>
              </label>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
