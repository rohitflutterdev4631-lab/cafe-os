'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UtensilsCrossed, Loader2 } from 'lucide-react';

export default function QrRedirectPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/public/qr/${params.token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.targetUrl) {
          router.replace(data.targetUrl);
        } else {
          setError(data.error || 'Invalid or expired QR code.');
        }
      })
      .catch(() => setError('Failed to connect to menu server.'));
  }, [params.token, router]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-4 animate-bounce">
        <UtensilsCrossed className="w-6 h-6" />
      </div>

      {error ? (
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-rose-400">QR Code Error</h2>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-slate-100">Connecting to Digital Menu...</h2>
          <p className="text-xs text-slate-400">Loading live dishes, specials & table service</p>
          <div className="pt-2 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
}
