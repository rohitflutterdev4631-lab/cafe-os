'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw,
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Search,
  X,
  Printer,
  XCircle,
  Sparkles,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { soundFx } from '@/components/ui/AudioAlert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function KitchenKDSPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTab, setCurrentTab] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Confirmation Dialog
  const [confirmRejectOrder, setConfirmRejectOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Ingredients out of stock');

  const previousPendingIdsRef = useRef<Set<string>>(new Set());
  const { success, error: toastError, info } = useToast();

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchKitchenOrders = async (silent = false) => {
    try {
      const res = await fetch('/api/v1/orders');
      const data = await res.json();
      if (data.success) {
        const newOrders = data.orders || [];
        setOrders(newOrders);

        // Chime detection for newly placed PENDING orders
        const currentPendingIds = new Set<string>(
          newOrders
            .filter((o: any) => o.status === 'PENDING')
            .map((o: any) => String(o.id))
        );

        if (!loading && previousPendingIdsRef.current.size > 0 && soundEnabled) {
          const hasNewPending = Array.from(currentPendingIds).some(
            (id) => !previousPendingIdsRef.current.has(id as string)
          );
          if (hasNewPending) {
            soundFx.newOrder();
            info('New Kitchen Ticket', 'New order ready for kitchen dispatch.');
          }
        }
        previousPendingIdsRef.current = currentPendingIds;
      }
    } catch {
      if (!silent) toastError('Error', 'Could not refresh orders');
    } finally {
      setLoading(false);
    }
  };

  // Poll kitchen orders every 3.5 seconds
  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(() => {
      fetchKitchenOrders(true);
    }, 3500);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const handleAdvanceStatus = async (orderId: string, currentStatus: string) => {
    setUpdatingId(orderId);
    let nextStatus = 'PREPARING';
    if (currentStatus === 'PENDING') nextStatus = 'PREPARING';
    else if (currentStatus === 'ACCEPTED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'READY';
    else if (currentStatus === 'READY') nextStatus = 'COMPLETED';

    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();

      if (data.success) {
        if (soundEnabled && nextStatus === 'READY') {
          soundFx.orderReady();
        }
        success('Status Updated', `Order #${data.order.orderNumber} is now ${nextStatus}`);
        fetchKitchenOrders(true);
      } else {
        toastError('Update Failed', data.error || 'Failed to update order status');
      }
    } catch {
      toastError('Network Error', 'Check your connection');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!confirmRejectOrder) return;
    setUpdatingId(confirmRejectOrder.id);
    try {
      const res = await fetch(`/api/v1/orders/${confirmRejectOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', cancelReason: rejectionReason }),
      });
      if (res.ok) {
        success('Order Rejected', `Order #${confirmRejectOrder.orderNumber} was cancelled.`);
        setConfirmRejectOrder(null);
        fetchKitchenOrders(true);
      } else {
        toastError('Reject Failed', 'Could not cancel ticket.');
      }
    } catch {
      toastError('Network Error', 'Check your connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getElapsedMinutes = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(elapsedMs / 60000));
  };

  // Tab count calculations
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const activeCount = pendingCount + preparingCount + readyCount;

  // Filtered orders list
  const filteredOrders = orders.filter((o) => {
    if (currentTab === 'PENDING' && o.status !== 'PENDING') return false;
    if (currentTab === 'PREPARING' && o.status !== 'PREPARING' && o.status !== 'ACCEPTED') return false;
    if (currentTab === 'READY' && o.status !== 'READY') return false;
    if (currentTab === 'COMPLETED' && o.status !== 'COMPLETED') return false;
    if (currentTab === 'ALL' && !['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customerName?.toLowerCase().includes(q);
      const matchTable = o.tableNumber?.toLowerCase().includes(q);
      return matchNum || matchCust || matchTable;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 flex flex-col font-sans select-none">
      {/* 1. KITCHEN LUXURY HEADER */}
      <header className="bg-stone-950/95 border-b border-stone-850 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 backdrop-blur-xl">
        {/* Left: Branding & Active Count */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 border border-stone-800 transition"
            title="Return to Owner Headquarters"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center font-bold shadow-lg shadow-amber-600/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-stone-100">
                  Kitchen Display System
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold border border-amber-500/30">
                  KDS PRO
                </span>
              </div>
              <div className="text-xs text-stone-400 font-mono flex items-center gap-2">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Station Pass
                </span>
                <span>•</span>
                <span className="font-bold text-stone-200">{activeCount} Active Tickets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Clock & Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Live Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs font-mono font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>{currentTime || '00:00:00 AM'}</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-850'
            }`}
            title={soundEnabled ? 'Kitchen Audio Alerts On' : 'Kitchen Audio Alerts Muted'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
            <span className="hidden md:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-850 shadow-sm transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen Tablet Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchKitchenOrders()}
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:bg-stone-850 shadow-sm transition"
            title="Manual sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION & SEARCH BAR */}
      <div className="bg-stone-950/80 border-b border-stone-850 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-md">
        {/* Status Navigation Tabs with Counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Orders', count: activeCount },
            { id: 'PENDING', label: 'New Tickets', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'PREPARING', label: 'In Prep', count: preparingCount },
            { id: 'READY', label: 'Ready to Serve', count: readyCount },
            { id: 'COMPLETED', label: 'Fulfilled', count: completedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
                currentTab === tab.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'bg-stone-900/80 hover:bg-stone-850 text-stone-400 border border-stone-800 hover:text-stone-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-extrabold ${
                  currentTab === tab.id
                    ? 'bg-stone-950/40 text-amber-200'
                    : tab.highlight
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-stone-800 text-stone-400 border border-stone-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick Order Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, table, customer..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-stone-900 border border-stone-800 text-stone-100 placeholder:text-stone-500 rounded-xl focus:outline-none focus:border-amber-500/50 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. ORDER CARDS GRID (DARK LUXURY THEME) */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {loading && orders.length === 0 ? (
          <div className="h-full flex items-center justify-center py-24 text-stone-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mr-2" />
            Connecting to kitchen dispatch stream...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-24 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 shadow-xl flex items-center justify-center text-amber-400 mb-1">
              <ChefHat className="w-8 h-8" />
            </div>
            <div className="font-extrabold text-base text-stone-200">
              No tickets in {currentTab === 'ALL' ? 'active' : currentTab.toLowerCase()} status
            </div>
            <p className="text-xs text-stone-500 max-w-sm">
              New table QR orders and takeaway tickets will chime and populate here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredOrders.map((ord) => {
              const elapsedMins = getElapsedMinutes(ord.createdAt);
              const isOverdue = elapsedMins >= 15;
              const isWarning = elapsedMins >= 10 && elapsedMins < 15;

              return (
                <div
                  key={ord.id}
                  className={`bg-stone-900/90 rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-xl overflow-hidden hover:border-amber-500/50 ${
                    isOverdue
                      ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                      : ord.status === 'PREPARING'
                      ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                      : ord.status === 'READY'
                      ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'border-stone-800'
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div
                      className={`p-4 border-b flex items-center justify-between ${
                        isOverdue
                          ? 'bg-rose-950/40 border-rose-900/50'
                          : ord.status === 'PREPARING'
                          ? 'bg-amber-950/40 border-amber-900/50'
                          : ord.status === 'READY'
                          ? 'bg-emerald-950/40 border-emerald-900/50'
                          : 'bg-stone-950 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-lg text-stone-100">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-stone-800 border border-stone-700 text-amber-300">
                          {ord.orderType === 'DINE_IN'
                            ? `T-${ord.tableNumber || '-'}`
                            : ord.orderType}
                        </span>
                      </div>

                      {/* Elapsed Timer & Overdue badge */}
                      <div className="flex items-center gap-1.5">
                        {isOverdue && (
                          <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-600 text-white animate-pulse">
                            OVERDUE
                          </span>
                        )}
                        <span
                          className={`text-xs font-mono font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                            isOverdue
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : isWarning
                              ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                              : 'bg-stone-900 text-stone-400 border-stone-800'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>{elapsedMins}m</span>
                        </span>
                      </div>
                    </div>

                    {/* Customer & Ticket Metadata */}
                    <div className="px-4 py-2 border-b border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
                      <span className="font-medium text-stone-300 truncate">
                        {ord.customerName ? ord.customerName : 'Walk-in Guest'}
                        {ord.customerPhone ? ` (${ord.customerPhone})` : ''}
                      </span>
                      <span className="font-mono text-stone-500 text-[11px]">
                        {formatDateTime(ord.createdAt).split(',')[1]}
                      </span>
                    </div>

                    {/* Special Instructions Alert */}
                    {ord.notes && (
                      <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 text-amber-200 text-xs font-semibold flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[10px] text-amber-400 block font-mono">
                            Kitchen Note
                          </span>
                          <span>{ord.notes}</span>
                        </div>
                      </div>
                    )}

                    {/* Food Items Checklist */}
                    <div className="p-4 space-y-3">
                      {ord.items.map((it: any) => (
                        <div
                          key={it.id}
                          className="border-b border-stone-800/80 pb-2.5 last:border-0 last:pb-0"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-stone-100 text-sm">
                              <span className="inline-block w-6 text-amber-400 font-black font-mono">
                                {it.quantity}x
                              </span>
                              {it.itemName}
                            </span>
                            {it.variantName && (
                              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 shrink-0 border border-stone-700">
                                {it.variantName}
                              </span>
                            )}
                          </div>

                          {it.addons && it.addons.length > 0 && (
                            <div className="pl-6 mt-1 space-y-0.5">
                              {it.addons.map((ad: any) => (
                                <div key={ad.id} className="text-xs text-stone-400 font-medium">
                                  + {ad.addonName}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
                    {ord.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAdvanceStatus(ord.id, ord.status)}
                          disabled={updatingId === ord.id}
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-md shadow-amber-950/40"
                        >
                          Accept Ticket
                        </button>
                        <button
                          onClick={() => setConfirmRejectOrder(ord)}
                          className="px-3 py-2.5 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-900/60 text-rose-300 font-semibold rounded-xl text-xs transition"
                          title="Reject ticket"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {ord.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleAdvanceStatus(ord.id, ord.status)}
                        disabled={updatingId === ord.id}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-stone-950 font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2"
                      >
                        <ChefHat className="w-4 h-4" /> Start Cooking
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        onClick={() => handleAdvanceStatus(ord.id, ord.status)}
                        disabled={updatingId === ord.id}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-md shadow-emerald-950/40 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Food Ready for Pass
                      </button>
                    )}

                    {ord.status === 'READY' && (
                      <button
                        onClick={() => handleAdvanceStatus(ord.id, ord.status)}
                        disabled={updatingId === ord.id}
                        className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 border border-stone-700"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mark Served / Complete
                      </button>
                    )}

                    {ord.status === 'COMPLETED' && (
                      <div className="w-full flex items-center justify-between text-xs text-stone-400 font-semibold font-mono">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Fulfilled
                        </span>
                        <span>{formatCurrency(ord.totalAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reject Order Confirmation Dialog */}
      {confirmRejectOrder && (
        <ConfirmDialog
          isOpen={!!confirmRejectOrder}
          onClose={() => setConfirmRejectOrder(null)}
          onConfirm={handleConfirmReject}
          title={`Reject Ticket #${confirmRejectOrder.orderNumber}?`}
          description="Rejecting will notify the dining customer that the kitchen cannot fulfill this ticket. Please select a reason below:"
          confirmText="Confirm Rejection"
          variant="danger"
          loading={updatingId === confirmRejectOrder.id}
        >
          <div className="mt-3 space-y-2">
            {[
              'Ingredients out of stock',
              'Kitchen at maximum capacity',
              'Kitchen closed for the day',
              'Customer requested cancellation',
            ].map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  rejectionReason === reason
                    ? 'border-rose-500/50 bg-rose-950/40 text-rose-200 font-semibold'
                    : 'border-stone-800 hover:bg-stone-850 text-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="kds_reason"
                  checked={rejectionReason === reason}
                  onChange={() => setRejectionReason(reason)}
                  className="text-rose-500"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
