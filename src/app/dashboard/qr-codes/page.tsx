'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
  Layers,
  Palette,
} from 'lucide-react';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { useToast } from '@/components/ui/Toast';

export default function DashboardQrCodesPage() {
  const [qrCodes, setQrCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQr, setSelectedQr] = useState<any>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [qrColor, setQrColor] = useState('#D97706'); // Warm amber accent
  const { success, info } = useToast();

  const colorOptions = [
    { label: 'Warm Amber', hex: '#D97706' },
    { label: 'Deep Charcoal', hex: '#1C1917' },
    { label: 'Refined Emerald', hex: '#10B981' },
    { label: 'Espresso Brown', hex: '#451A03' },
  ];

  const fetchQrs = async () => {
    try {
      const res = await fetch('/api/v1/qr-codes');
      const data = await res.json();
      if (data.success) {
        setQrCodes(data.qrCodes);
        if (data.qrCodes.length > 0 && !selectedQr) {
          setSelectedQr(data.qrCodes[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQrs();
  }, []);

  const handleColorChange = async (hex: string) => {
    setQrColor(hex);
    if (selectedQr) {
      const updatedDataUrl = await generateQRCodeDataUrl(selectedQr.fullUrl, {
        color: { dark: hex, light: '#FFFFFF' },
      });
      setSelectedQr({ ...selectedQr, dataUrl: updatedDataUrl });
      info('QR Color Updated', `Color changed to ${hex}`);
    }
  };

  const handleCopyLink = (fullUrl: string, token: string) => {
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    success('Link Copied', 'Destination URL copied to clipboard.');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS High-Resolution Print Assets
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">QR Code Studio</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Permanent high-resolution QR codes with redirect tracking and print-ready table tent cards.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 transition flex items-center gap-1.5 self-start sm:self-auto no-print"
        >
          <Printer className="w-3.5 h-3.5" /> Print Table Tent Cards
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 bg-stone-900 rounded-2xl border border-stone-800">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-stone-900/90 rounded-2xl border border-stone-800 shadow-xl overflow-hidden divide-y divide-stone-800">
              {qrCodes.map((qr) => {
                const isSelected = selectedQr?.id === qr.id;
                const label =
                  qr.type === 'CAFE_GENERAL'
                    ? 'Main Entrance / General Cafe QR'
                    : `Table ${qr.table?.tableNumber || '-'}`;

                return (
                  <div
                    key={qr.id}
                    onClick={() => setSelectedQr(qr)}
                    className={`p-4 transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : 'hover:bg-stone-850'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={qr.dataUrl}
                        alt="QR Code"
                        className="w-14 h-14 rounded-xl border border-stone-700 bg-white p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-stone-100 flex items-center gap-2">
                          {label}
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 uppercase border border-stone-700">
                            {qr.type}
                          </span>
                        </div>
                        <div className="text-xs text-stone-400 font-mono mt-0.5 truncate">
                          {qr.fullUrl}
                        </div>
                        <div className="text-xs text-amber-400 font-mono font-semibold mt-1">
                          {qr.scanCount} total customer scans
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(qr.fullUrl, qr.token);
                        }}
                        className="p-2 border border-stone-800 hover:bg-stone-800 rounded-xl text-stone-300 transition"
                        title="Copy QR Destination URL"
                      >
                        {copiedToken === qr.token ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <a
                        href={qr.dataUrl}
                        download={`${qr.token}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition"
                        title="Download High-Res PNG"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Print-ready Tent Card Preview */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-6 shadow-xl sticky top-6 h-fit text-center space-y-4">
            {selectedQr ? (
              <>
                {/* Palette picker */}
                <div className="no-print">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2 font-mono">
                    Custom QR Color Palette
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.hex}
                        onClick={() => handleColorChange(opt.hex)}
                        style={{ backgroundColor: opt.hex }}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          qrColor === opt.hex ? 'ring-2 ring-amber-400 scale-110 border-white' : 'border-stone-700'
                        }`}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>

                <div id="printable-receipt" className="space-y-4">
                  <div className="text-xs font-bold uppercase text-stone-400 tracking-wider font-mono">
                    Print-Ready Table Card
                  </div>

                  {/* Printable Tent Card */}
                  <div className="p-6 rounded-2xl border-2 border-stone-800 bg-stone-950 space-y-3 shadow-xl max-w-xs mx-auto">
                    <div className="font-extrabold text-base tracking-tight text-stone-100">
                      SCAN FOR DIGITAL MENU
                    </div>
                    <div className="text-xs text-amber-400 font-mono">
                      {selectedQr.type === 'TABLE'
                        ? `Table ${selectedQr.table?.tableNumber}`
                        : 'Contactless Ordering'}
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-800 inline-block shadow-md">
                      <img
                        src={selectedQr.dataUrl}
                        alt="Selected QR"
                        className="w-44 h-44 mx-auto"
                      />
                    </div>

                    <div className="text-[11px] text-stone-300 font-medium">
                      Point phone camera to browse dishes, customize, and order instantly.
                    </div>
                    <div className="text-[9px] text-stone-500 font-mono">Powered by CAFE OS 3D</div>
                  </div>

                  <div className="pt-2 flex justify-center gap-2 no-print">
                    <a
                      href={selectedQr.dataUrl}
                      download={`${selectedQr.token}.png`}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 transition flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Download PNG
                    </a>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-300 hover:bg-stone-800 flex items-center gap-1.5 transition"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Card
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-stone-500 text-sm">Select a QR code to view and print.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
