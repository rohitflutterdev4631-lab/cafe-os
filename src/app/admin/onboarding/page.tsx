'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlus,
  Store,
  FileSpreadsheet,
  QrCode,
  CheckCircle2,
  Copy,
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const SAMPLE_CSV = `Category,Item Name,Description,Price,Food Type,Prep Time
Artisanal Coffee,Flat White,Velvety double shot espresso with microfoam,169,VEG,5
Artisanal Coffee,Cold Brew Tonic,Steeped 18 hours with citrus tonic,199,VEG,4
Stonebaked Pizza,Margherita Bufala,Fresh buffalo mozzarella and basil,399,VEG,15
Gourmet Burgers,Smoked Truffle Smash,Brioche bun with aged cheddar,349,NON_VEG,12
Desserts,Belgian Chocolate Tart,Rich dark ganache with sea salt,229,EGG,3`;

export default function AdminOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Cafe & Owner Form
  const [cafeData, setCafeData] = useState({
    cafeName: 'Roastery & Co.',
    ownerName: 'Vikram Malhotra',
    ownerEmail: 'vikram@roastery.com',
    ownerPhone: '9876543210',
    address: 'Sector 35 Inner Market, Chandigarh',
    planName: 'Pro',
    tempPassword: 'NordWelcome2026!',
    themeColor: '#2563EB',
    description: 'Specialty cafe and artisan bakery',
  });

  // Step 2: Menu CSV
  const [csvContent, setCsvContent] = useState(SAMPLE_CSV);
  const [importStats, setImportStats] = useState<any>(null);

  // Completed Result
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Step 1 Submission: Create Cafe
  const handleCreateCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/admin/cafes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cafeData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create cafe');

      setCreatedResult(data);
      setStep(2); // Proceed to CSV menu import
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submission: Import Menu Items
  const handleImportMenu = async () => {
    if (!createdResult?.cafe?.id) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/menus/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafeId: createdResult.cafe.id,
          csvContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import menu CSV');

      setImportStats(data);
      setStep(3); // Proceed to Final Review & Handoff
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!createdResult) return;
    const text = `🎉 Welcome to Nord Cafe!
Your Digital Menu is Ready:
Menu URL: ${window.location.origin}/c/${createdResult.cafe.slug}
Admin Dashboard: ${window.location.origin}/login
Email: ${createdResult.credentials.email}
Password: ${createdResult.credentials.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Admin-Assisted Cafe Onboarding
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Set up a turnkey digital menu on behalf of a cafe owner and generate instant QR codes.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-sm">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            1
          </div>
          <span>Cafe & Owner Details</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            2
          </div>
          <span>Menu CSV Digitization</span>
        </div>
        <div className="w-12 h-0.5 bg-slate-200"></div>
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            3
          </div>
          <span>Handoff & QR Codes</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: Cafe Details */}
      {step === 1 && (
        <form onSubmit={handleCreateCafe} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
            Step 1: Cafe Brand & Owner Account
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Cafe Name</label>
              <input
                type="text"
                required
                value={cafeData.cafeName}
                onChange={(e) => setCafeData({ ...cafeData, cafeName: e.target.value })}
                placeholder="e.g. The Bakehouse by Sector 35"
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Subscription Tier</label>
              <select
                value={cafeData.planName}
                onChange={(e) => setCafeData({ ...cafeData, planName: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="Pro">Pro Plan (₹499/mo) — Live orders & Branding</option>
                <option value="Business">Business Plan (₹999/mo) — Multi-branch & KDS</option>
                <option value="Free">Free Plan (₹0) — 20 items & 1 QR</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Owner Full Name</label>
              <input
                type="text"
                required
                value={cafeData.ownerName}
                onChange={(e) => setCafeData({ ...cafeData, ownerName: e.target.value })}
                placeholder="e.g. Gurpreet Singh"
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Owner Email</label>
              <input
                type="email"
                required
                value={cafeData.ownerEmail}
                onChange={(e) => setCafeData({ ...cafeData, ownerEmail: e.target.value })}
                placeholder="owner@cafe.com"
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Owner Phone / WhatsApp</label>
              <input
                type="tel"
                value={cafeData.ownerPhone}
                onChange={(e) => setCafeData({ ...cafeData, ownerPhone: e.target.value })}
                placeholder="+91 98140 00000"
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600">Temporary Password</label>
              <input
                type="text"
                value={cafeData.tempPassword}
                onChange={(e) => setCafeData({ ...cafeData, tempPassword: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-slate-600">Physical Address / Branch</label>
              <input
                type="text"
                value={cafeData.address}
                onChange={(e) => setCafeData({ ...cafeData, address: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-purple-700 transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Cafe & Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: CSV Menu Importer */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Step 2: Digitize Menu for {createdResult?.cafe?.name}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full">
              Slug: /c/{createdResult?.cafe?.slug}
            </span>
          </div>

          <p className="text-sm text-slate-600">
            Paste or edit existing menu items in CSV format. The parser will automatically create categories and items with prices, food types, and preparation times.
          </p>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Menu CSV Data (Columns: Category, Item Name, Description, Price, Food Type, Prep Time)
            </label>
            <textarea
              rows={9}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-purple-500 focus:border-purple-500 bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Skip menu import for now
            </button>

            <button
              type="button"
              onClick={handleImportMenu}
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-purple-700 transition flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import Menu & Generate QRs'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Handoff & Go Live */}
      {step === 3 && createdResult && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">
            {createdResult.cafe.name} is Live!
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            The digital menu has been created with default tables (T-01, T-02, T-03), permanent QR codes, and full menu items.
          </p>

          {importStats && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-700 max-w-md mx-auto">
              {importStats.message}
            </div>
          )}

          {/* Credentials Card */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-lg mx-auto text-left space-y-3">
            <div className="text-xs font-bold uppercase text-slate-500">Owner Access Credentials</div>
            <div className="text-sm flex justify-between">
              <span className="text-slate-500">Login URL:</span>
              <span className="font-mono text-purple-600">/login</span>
            </div>
            <div className="text-sm flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">{createdResult.credentials.email}</span>
            </div>
            <div className="text-sm flex justify-between">
              <span className="text-slate-500">Temporary Password:</span>
              <span className="font-mono font-bold text-slate-900">{createdResult.credentials.temporaryPassword}</span>
            </div>

            <button
              onClick={copyCredentials}
              className="w-full mt-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied to Clipboard!' : 'Copy Invitation Message'}
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href={`/c/${createdResult.cafe.slug}`}
              target="_blank"
              className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm shadow hover:bg-blue-700 transition flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" /> Preview Live Digital Menu
            </Link>

            <Link
              href="/admin/cafes"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-sm transition"
            >
              Return to Cafe Directory
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
