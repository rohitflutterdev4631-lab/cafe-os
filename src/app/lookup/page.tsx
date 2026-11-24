'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, UtensilsCrossed, ArrowRight, AlertCircle, Loader2, Coffee } from 'lucide-react';

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('NC-9101');
  const [phone, setPhone] = useState('9876543210');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanNum = orderNumber.trim().toUpperCase();
      const res = await fetch(`/api/v1/public/orders/${cleanNum}?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.order) {
        throw new Error('Order not found with the provided details. Please verify the order number.');
      }

      router.push(`/c/${data.order.cafe.slug}/orders/${data.order.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#09291F] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E6AD38] selection:text-[#09291F]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/c/nordic-roast" className="inline-flex items-center gap-2.5 mb-3">
          <div className="h-11 w-11 rounded-2xl bg-[#09291F] border border-[#E6AD38]/40 flex items-center justify-center text-[#E6AD38] shadow-lg shadow-black/20">
            <Coffee className="w-6 h-6" />
          </div>
          <span className="font-serif font-black text-2xl tracking-tight text-[#09291F]">
            Nordic Roast <span className="text-[#123D2E]">&amp; Bakery</span>
          </span>
        </Link>
        <h1 className="text-2xl font-serif font-bold tracking-tight text-[#09291F]">
          Track Your Cafe Order
        </h1>
        <p className="text-xs text-[#563B2D] mt-1 font-light">
          Check live preparation progress or reprint your dining receipt.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 shadow-sm rounded-3xl border border-[#E3D8C5]">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4 text-xs text-[#09291F]">
            <div>
              <label className="font-bold text-[#123D2E] uppercase tracking-wider text-[11px] font-mono">
                Order Ticket Number *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. NC-9101"
                className="mt-1 w-full px-4 py-3 font-mono text-sm border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl uppercase focus:border-[#123D2E] outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#123D2E] uppercase tracking-wider text-[11px] font-mono">
                Registered Mobile Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210 (Optional)"
                className="mt-1 w-full px-4 py-3 text-sm font-mono border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl focus:border-[#123D2E] outline-none placeholder-[#887966]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] text-[#09291F] font-black rounded-xl text-xs uppercase tracking-wider font-mono shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Looking up order...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Track Order <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-[#E3D8C5] pt-4">
            <Link
              href="/c/nordic-roast"
              className="text-xs font-semibold text-[#563B2D] hover:text-[#123D2E] transition"
            >
              ← Back to Nordic Roast &amp; Bakery Menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
