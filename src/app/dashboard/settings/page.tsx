'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, Store, CreditCard, Shield, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function DashboardSettingsPage() {
  const [cafe, setCafe] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/cafes/me').then((r) => r.json()),
      fetch('/api/v1/cafes/me/settings').then((r) => r.json()),
    ]).then(([cData, sData]) => {
      if (cData.success) setCafe(cData.cafe);
      if (sData.success) setSettings(sData.settings);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const [resCafe, resSettings] = await Promise.all([
        fetch('/api/v1/cafes/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cafe),
        }),
        fetch('/api/v1/cafes/me/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        }),
      ]);

      if (resCafe.ok && resSettings.ok) {
        success('Settings Saved', 'Changes are live immediately on your digital menu.');
      } else {
        toastError('Save Failed', 'Could not update all cafe settings.');
      }
    } catch {
      toastError('Network Error', 'Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl text-stone-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS Operations & Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Cafe Settings</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Configure your restaurant branding, ordering rules, GST taxation, and operational parameters.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding & Profile */}
        <div className="bg-stone-900/90 p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-stone-100 border-b border-stone-800 pb-3">
            Restaurant Identity & Branding
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Cafe Name *</label>
              <input
                type="text"
                required
                value={cafe.name || ''}
                onChange={(e) => setCafe({ ...cafe, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Menu Slug *</label>
              <input
                type="text"
                required
                value={cafe.slug || ''}
                onChange={(e) => setCafe({ ...cafe, slug: e.target.value })}
                className="mt-1 w-full px-3 py-2 font-mono border border-stone-800 rounded-xl text-sm text-amber-400 bg-stone-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Description / Bio</label>
              <textarea
                rows={2}
                value={cafe.description || ''}
                onChange={(e) => setCafe({ ...cafe, description: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Logo Image URL</label>
              <input
                type="url"
                value={cafe.logo || ''}
                onChange={(e) => setCafe({ ...cafe, logo: e.target.value })}
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100 placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Cover Banner Image URL</label>
              <input
                type="url"
                value={cafe.coverImage || ''}
                onChange={(e) => setCafe({ ...cafe, coverImage: e.target.value })}
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100 placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Brand Primary Accent Color</label>
              <div className="mt-1 flex items-center gap-3">
                <input
                  type="color"
                  value={cafe.themeColor || '#D97706'}
                  onChange={(e) => setCafe({ ...cafe, themeColor: e.target.value })}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-stone-800 bg-stone-950 p-0.5"
                />
                <span className="font-mono text-sm text-amber-400">{cafe.themeColor || '#D97706'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Taxes & Ordering Rules */}
        <div className="bg-stone-900/90 p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-stone-100 border-b border-stone-800 pb-3">
            Taxation, Fees & Ordering Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Tax Rate (% GST)</label>
              <input
                type="number"
                step="0.1"
                value={settings?.taxRatePercent ?? 5.0}
                onChange={(e) => setSettings({ ...settings, taxRatePercent: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Takeaway Packaging Fee (₹)</label>
              <input
                type="number"
                value={settings?.packagingFee ?? 0}
                onChange={(e) => setSettings({ ...settings, packagingFee: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100 font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Min Order Value (₹)</label>
              <input
                type="number"
                value={settings?.minOrderValue ?? 0}
                onChange={(e) => setSettings({ ...settings, minOrderValue: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-950 text-stone-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800 flex flex-wrap gap-6 text-sm text-stone-300">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={settings?.orderingEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, orderingEnabled: e.target.checked })}
                className="rounded border-stone-800 text-amber-500 bg-stone-950 focus:ring-amber-500"
              />
              Accept Online Orders
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={settings?.dineInEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, dineInEnabled: e.target.checked })}
                className="rounded border-stone-800 text-amber-500 bg-stone-950 focus:ring-amber-500"
              />
              Table Dine-in
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={settings?.takeawayEnabled ?? true}
                onChange={(e) => setSettings({ ...settings, takeawayEnabled: e.target.checked })}
                className="rounded border-stone-800 text-amber-500 bg-stone-950 focus:ring-amber-500"
              />
              Takeaway Pickup
            </label>
          </div>
        </div>

        {/* Legal & Compliance */}
        <div className="bg-stone-900/90 p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl space-y-4">
          <h2 className="text-base font-bold text-stone-100 border-b border-stone-800 pb-3">
            Business Compliance & Licenses
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">GSTIN (Optional)</label>
              <input
                type="text"
                value={cafe.gstin || ''}
                onChange={(e) => setCafe({ ...cafe, gstin: e.target.value })}
                placeholder="03AAAAA0000A1Z5"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm font-mono bg-stone-950 text-stone-100 placeholder:text-stone-600"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">FSSAI License # (Where applicable)</label>
              <input
                type="text"
                value={cafe.fssai || ''}
                onChange={(e) => setCafe({ ...cafe, fssai: e.target.value })}
                placeholder="10020011000543"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm font-mono bg-stone-950 text-stone-100 placeholder:text-stone-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 flex items-center gap-2 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
