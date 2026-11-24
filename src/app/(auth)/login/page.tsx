'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, ShieldCheck, Store, ChefHat, UserCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemoPersonas, setShowDemoPersonas] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('demo') === '1' || params.get('demo') === 'true') {
        setShowDemoPersonas(true);
      }
    }
  }, []);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Route based on role
      const role = data.user.role;
      if (role === 'SUPER_ADMIN' || role === 'ADMIN_STAFF') {
        router.push('/admin');
      } else if (role === 'KITCHEN_STAFF') {
        router.push('/kitchen');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demEmail: string, demPass: string) => {
    setEmail(demEmail);
    setPassword(demPass);
    handleLogin(undefined, demEmail, demPass);
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
          Sign in to Headquarters
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          Or{' '}
          <Link href="/register" className="font-medium text-amber-400 hover:text-amber-300">
            register a new cafe license
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

          {/* Testing Mode Preset Selector */}
          {showDemoPersonas && (
            <div className="mb-5 p-3 bg-stone-950 border border-stone-800 rounded-2xl">
              <div className="flex items-center justify-between text-xs font-semibold text-amber-300 mb-2 font-mono">
                <span>⚡ Testing Mode: Quick Fill Persona</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">DEMO</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('owner@nordicroast.com');
                    setPassword('owner123');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left font-medium transition ${
                    email === 'owner@nordicroast.com'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  ☕ Cafe Owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@nordcafe.com');
                    setPassword('admin123');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left font-medium transition ${
                    email === 'admin@nordcafe.com'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  👑 Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('kitchen@nordicroast.com');
                    setPassword('kitchen123');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left font-medium transition ${
                    email === 'kitchen@nordicroast.com'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  🍳 Kitchen KDS
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@nordicroast.com');
                    setPassword('manager123');
                  }}
                  className={`px-2 py-1.5 rounded-lg border text-left font-medium transition ${
                    email === 'manager@nordicroast.com'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                      : 'bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  👔 Cafe Manager
                </button>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider text-[10px]">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider text-[10px]">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 border border-stone-800 bg-stone-950 text-stone-100 rounded-xl shadow-inner placeholder-stone-600 focus:outline-none focus:border-amber-500/50 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-md shadow-amber-950/40 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-500 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2 font-mono">
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                </span>
              ) : (
                'Sign in to CAFE OS'
              )}
            </button>
          </form>

          {/* Persona Fast Login shortcuts */}
          <div className="mt-6 pt-5 border-t border-stone-800">
            <p className="text-xs text-stone-400 text-center font-bold mb-3 font-mono">
              Quick One-Click Sign In:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('owner@nordicroast.com', 'owner123')}
                className="w-full py-2 px-3 text-xs bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-200 font-medium flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cafe Owner Account</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">owner@nordicroast.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('kitchen@nordicroast.com', 'kitchen123')}
                className="w-full py-2 px-3 text-xs bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-200 font-medium flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kitchen KDS Terminal</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">kitchen@nordicroast.com</span>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('admin@nordcafe.com', 'admin123')}
                className="w-full py-2 px-3 text-xs bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl text-stone-200 font-medium flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Super Admin Portal</span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">admin@nordcafe.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
