'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    cafeName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewSlug = formData.cafeName
    ? formData.cafeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : 'your-cafe';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            CAFE <span className="text-amber-400">OS</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-100">
          Provision your CAFE OS 3D Headquarters
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900/90 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-stone-800">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4 text-xs text-stone-200" onSubmit={handleRegister}>
            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[10px]">Cafe / Restaurant Name</label>
              <input
                type="text"
                required
                value={formData.cafeName}
                onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
                placeholder="e.g. Nordic Roast Roasters"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm"
              />
              <p className="mt-1 text-xs text-stone-500 font-mono">
                Storefront URL preview: <span className="text-amber-400">/c/{previewSlug}</span>
              </p>
            </div>

            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[10px]">Your Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Rohit Sharma"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[10px]">Work Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="owner@cafe.com"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[10px]">Phone Number (For verification)</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-300 uppercase tracking-wider text-[10px]">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center py-2.5 px-4 rounded-xl shadow-md shadow-amber-950/40 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin" /> Provisioning Headquarters...
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-mono">
                  Initialize Cafe Headquarters <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
