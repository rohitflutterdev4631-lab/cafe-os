'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  ArrowLeft,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Shield,
  FileCheck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function SuperAdminImporterSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    enabled: 'true',
    allowedFormats: 'pdf,jpg,jpeg,png,webp,docx,xlsx,xls,csv',
    maxUploadSizeMb: '25',
    maxFilesPerImport: '10',
    maxPdfPages: '30',
    aiProvider: 'LOCAL_OCR_AI',
    monthlyQuotaPerCafe: '50',
  });

  const [providerStatus, setProviderStatus] = useState<any>({});

  useEffect(() => {
    fetch('/api/v1/admin/importer-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setSettings((prev) => ({ ...prev, ...data.data }));
          setProviderStatus(data.providers || {});
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/v1/admin/importer-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showToast('AI Importer configuration saved successfully', 'success');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (err) {
      showToast('Network error while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/importer">
          <Button variant="ghost" size="sm" className="p-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            AI Menu Importer Engine Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure global document ingestion parameters, file formats, quotas, and AI extraction providers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Global Feature Toggle */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-600" />
              Feature Availability
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-900">Enable AI Menu Importer Globally</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  When enabled, cafe owners and managers can upload menus and automatically generate digital catalogs.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enabled === 'true'}
                  onChange={(e) =>
                    setSettings({ ...settings, enabled: e.target.checked ? 'true' : 'false' })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* AI & OCR Provider Selection */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" />
              AI Extraction & OCR Provider
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active AI Extraction Provider
              </label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              >
                <option value="LOCAL_OCR_AI">
                  Built-in Intelligent Heuristic & Tesseract OCR (Zero Cost / 100% Offline)
                </option>
                <option value="GEMINI">Google Gemini 1.5 Flash (Multimodal High Precision)</option>
                <option value="OPENAI">OpenAI GPT-4o-mini (JSON Extraction)</option>
              </select>
            </div>

            {/* Provider status pills */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Built-in Local OCR</span>
                  <span className="text-emerald-600 font-semibold">Active</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Requires zero external API keys</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>Google Gemini API</span>
                  {providerStatus.geminiConfigured ? (
                    <span className="text-emerald-600 font-semibold">Key Detected</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">Not Configured</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Via GEMINI_API_KEY</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>OpenAI API</span>
                  {providerStatus.openAiConfigured ? (
                    <span className="text-emerald-600 font-semibold">Key Detected</span>
                  ) : (
                    <span className="text-slate-400 font-semibold">Not Configured</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Via OPENAI_API_KEY</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quotas & Limits */}
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" />
              Upload Quotas & Document Constraints
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Max Upload File Size (MB)"
                type="number"
                value={settings.maxUploadSizeMb}
                onChange={(e) => setSettings({ ...settings, maxUploadSizeMb: e.target.value })}
              />

              <Input
                label="Max Files Per Import Session"
                type="number"
                value={settings.maxFilesPerImport}
                onChange={(e) => setSettings({ ...settings, maxFilesPerImport: e.target.value })}
              />

              <Input
                label="Max PDF Pages Allowed"
                type="number"
                value={settings.maxPdfPages}
                onChange={(e) => setSettings({ ...settings, maxPdfPages: e.target.value })}
              />

              <Input
                label="Monthly Import Quota Per Cafe"
                type="number"
                value={settings.monthlyQuotaPerCafe}
                onChange={(e) => setSettings({ ...settings, monthlyQuotaPerCafe: e.target.value })}
              />
            </div>

            <div>
              <Input
                label="Allowed Document & Image Extensions"
                value={settings.allowedFormats}
                onChange={(e) => setSettings({ ...settings, allowedFormats: e.target.value })}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Comma-separated list (e.g. pdf,jpg,jpeg,png,webp,docx,xlsx,xls,csv)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/importer">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
