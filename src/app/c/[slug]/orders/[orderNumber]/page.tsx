'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  ShoppingBag,
  Printer,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Plus,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { soundFx } from '@/components/ui/AudioAlert';

export default function OrderTrackingPage({
  params,
}: {
  params: { slug: string; orderNumber: string };
}) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const previousStatusRef = useRef<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/v1/public/orders/${params.orderNumber}`);
      const data = await res.json();
      if (data.success) {
        const fetchedOrder = data.order;
        setOrder(fetchedOrder);

        // Chime when food is newly READY
        if (
          previousStatusRef.current &&
          previousStatusRef.current !== 'READY' &&
          fetchedOrder.status === 'READY'
        ) {
          soundFx.playOrderReadyChime();
        }
        previousStatusRef.current = fetchedOrder.status;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3-second live tracker
    return () => clearInterval(interval);
  }, [params.orderNumber]);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-[#F7F1E5] flex flex-col items-center justify-center p-6 text-[#123D2E]">
        <div className="w-12 h-12 rounded-2xl bg-[#09291F] flex items-center justify-center text-[#E6AD38] shadow-lg mb-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#E6AD38]" />
        </div>
        <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#09291F]">Connecting to Live Order Telemetry...</span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F1E5] flex flex-col items-center justify-center p-6 text-center text-[#09291F]">
        <div className="w-16 h-16 rounded-2xl bg-[#EFE5D2] border border-[#E3D8C5] flex items-center justify-center text-[#123D2E] mb-3 shadow-sm">
          <AlertCircle className="w-8 h-8 text-[#E6AD38]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#09291F]">Order Reference Not Found</h2>
        <p className="text-sm text-[#563B2D] mt-2 max-w-sm">
          Could not locate order #{params.orderNumber}. Please check your order ticket.
        </p>
        <Link
          href={`/c/${params.slug}`}
          className="mt-5 px-6 py-2.5 bg-[#123D2E] hover:bg-[#09291F] text-[#F7F1E5] rounded-xl text-xs font-bold shadow-md transition"
        >
          Return to Menu
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'PENDING', label: 'Order Placed', desc: 'Sent to cafe kitchen pass' },
    { key: 'ACCEPTED', label: 'Order Confirmed', desc: 'Acknowledged by barista / chef' },
    { key: 'PREPARING', label: 'Preparing', desc: 'Handcrafting your order' },
    {
      key: 'READY',
      label: 'Ready for Service',
      desc:
        order.orderType === 'DINE_IN'
          ? `Being served to Table ${order.tableNumber || '-'}`
          : 'Ready for counter collection',
    },
    { key: 'COMPLETED', label: 'Fulfilled', desc: 'Enjoy your meal!' },
  ];

  const statusHierarchy: Record<string, number> = {
    PENDING: 1,
    ACCEPTED: 2,
    PREPARING: 3,
    READY: 4,
    COMPLETED: 5,
    REJECTED: 0,
    CANCELLED: 0,
  };

  const currentStepNum = statusHierarchy[order.status] || 1;
  const isRejected = order.status === 'REJECTED' || order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#09291F] pb-24 font-sans selection:bg-[#E6AD38] selection:text-[#09291F]">
      {/* Header */}
      <header className="bg-[#09291F] text-white border-b border-[#1C5A40] sticky top-0 z-30 px-4 py-4 no-print shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            href={`/c/${params.slug}`}
            className="flex items-center gap-1.5 text-xs font-bold text-[#F7F1E5] hover:text-[#E6AD38] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Menu
          </Link>
          <span className="font-serif font-bold text-sm sm:text-base text-white tracking-wide">
            Live Ticket #{order.orderNumber}
          </span>
          <button
            onClick={() => window.print()}
            className="text-xs font-bold text-[#D6B36A] hover:text-white flex items-center gap-1 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Bill
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-8 space-y-6">
        {/* Status Card */}
        <div className="bg-white p-7 rounded-3xl border border-[#E3D8C5] shadow-sm text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#123D2E] text-[#E6AD38] border border-[#1C5A40]">
            <span className="w-2 h-2 rounded-full bg-[#E6AD38] animate-pulse"></span>
            Real-Time Kitchen Feed
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#09291F] tracking-tight">
            {isRejected
              ? `Order ${order.status}`
              : order.status === 'COMPLETED'
              ? 'Order Fulfilled & Served!'
              : order.status === 'READY'
              ? '🎉 Your Food is Ready!'
              : order.status === 'PREPARING'
              ? 'Chef is Preparing Your Food'
              : 'Order Placed & Awaiting Kitchen'}
          </h1>

          <p className="text-xs text-[#563B2D] font-mono">
            {order.orderType === 'DINE_IN'
              ? `Table Dine-In • Table ${order.tableNumber || '-'}`
              : order.orderType}{' '}
            • {formatDateTime(order.createdAt)}
          </p>

          {order.rejectionReason && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl font-medium">
              Cafe note: {order.rejectionReason}
            </div>
          )}
        </div>

        {/* Live Status Timeline */}
        {!isRejected && (
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E3D8C5] shadow-sm space-y-6 no-print">
            <h2 className="text-xs font-bold text-[#123D2E] uppercase tracking-wider font-mono">
              Preparation Milestone
            </h2>

            <div className="space-y-6">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isPassed = currentStepNum >= stepNum;
                const isCurrent = currentStepNum === stepNum;

                return (
                  <div key={step.key} className="flex items-start gap-4 relative">
                    {idx < steps.length - 1 && (
                      <div
                        className={`absolute left-4 top-8 -bottom-4 w-0.5 ${
                          currentStepNum > stepNum ? 'bg-[#123D2E]' : 'bg-[#E3D8C5]'
                        }`}
                      />
                    )}

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition ${
                        isCurrent
                          ? 'bg-[#E6AD38] text-[#09291F] ring-4 ring-[#E6AD38]/30 shadow-md animate-pulse'
                          : isPassed
                          ? 'bg-[#123D2E] text-[#E6AD38]'
                          : 'bg-[#EFE5D2] text-[#887966]'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-bold text-sm ${
                          isCurrent
                            ? 'text-[#123D2E] font-black'
                            : isPassed
                            ? 'text-[#09291F]'
                            : 'text-[#887966]'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-[#563B2D] mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action button to order more */}
        <div className="flex justify-center no-print">
          <Link
            href={`/c/${params.slug}${order.tableNumber ? `?table=${order.tableNumber}` : ''}`}
            className="px-6 py-3 bg-white border border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#09291F] rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#123D2E]" /> Order Additional Items
          </Link>
        </div>

        {/* Itemized Receipt Details */}
        <div
          id="printable-receipt"
          className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E3D8C5] shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E3D8C5] pb-3">
            <span className="font-serif font-bold text-base text-[#09291F]">Order Summary</span>
            <span className="text-xs text-[#563B2D] font-mono">Ref: {order.orderNumber}</span>
          </div>

          <div className="divide-y divide-[#E3D8C5]/60 text-xs">
            {order.items.map((it: any) => (
              <div key={it.id} className="py-3 flex justify-between gap-3">
                <div>
                  <span className="font-bold text-[#09291F]">
                    {it.quantity}x {it.itemName} {it.variantName ? `(${it.variantName})` : ''}
                  </span>
                  {it.addons && it.addons.length > 0 && (
                    <div className="text-[11px] text-[#563B2D] mt-0.5">
                      + {it.addons.map((a: any) => a.addonName).join(', ')}
                    </div>
                  )}
                </div>
                <span className="font-bold text-[#123D2E] font-mono shrink-0">
                  {formatCurrency(it.subtotalPrice)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E3D8C5] pt-3.5 space-y-2 text-xs text-[#563B2D]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount:</span>
                <span className="font-mono">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST (5%):</span>
              <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(order.taxAmount)}</span>
            </div>
            {order.packagingFee > 0 && (
              <div className="flex justify-between">
                <span>Packaging:</span>
                <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(order.packagingFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-serif font-black text-base text-[#09291F] border-t border-[#E3D8C5] pt-3">
              <span>Total Paid:</span>
              <span className="text-[#123D2E] font-mono text-lg">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
