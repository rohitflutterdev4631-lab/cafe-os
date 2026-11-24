'use client';

import React, { useState, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  UtensilsCrossed,
  Filter,
} from 'lucide-react';

interface KdsOrder {
  id: string;
  orderNumber: string;
  orderType: string;
  tableNumber?: string | null;
  status: string;
  customerName: string;
  createdAt: string;
  items: {
    id: string;
    itemName: string;
    variantName?: string | null;
    quantity: number;
    completed?: boolean;
  }[];
}

interface KdsInterfaceProps {
  onClose?: () => void;
  onOrderUpdated?: () => void;
}

export function KdsInterface({ onClose, onOrderUpdated }: KdsInterfaceProps) {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PREPARING' | 'READY'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [completedItemIds, setCompletedItemIds] = useState<Record<string, boolean>>({});

  const fetchLiveOrders = async () => {
    try {
      const res = await fetch('/api/v1/orders?status=ACTIVE');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveOrders();
    const interval = setInterval(fetchLiveOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchLiveOrders();
        if (onOrderUpdated) onOrderUpdated();
      }
    } catch (e: any) {
      alert('Error updating order');
    }
  };

  const toggleItemDone = (itemId: string) => {
    setCompletedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getElapsedTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'ALL') return true;
    return o.status === statusFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-950 border border-stone-800 rounded-3xl w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">KITCHEN KDS DISPLAY</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {orders.length} Active Orders
                </span>
              </div>
              <p className="text-xs text-stone-400">Live order ticket sequence & preparation timing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter buttons */}
            <div className="flex items-center bg-stone-900 p-1 rounded-xl border border-stone-800">
              {(['ALL', 'PENDING', 'PREPARING', 'READY'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    statusFilter === s
                      ? 'bg-amber-600 text-white'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
              title="Toggle Audio Alerts"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            </button>

            <button
              onClick={fetchLiveOrders}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
              title="Refresh Queue"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Tickets Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full h-64 flex items-center justify-center text-stone-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-2 text-amber-500" /> Loading kitchen tickets...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-stone-500 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40" />
              <p className="font-semibold text-sm text-stone-400">All kitchen tickets cleared!</p>
              <p className="text-xs text-stone-600">New orders from POS or table QR scans will appear automatically.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const elapsed = getElapsedTime(order.createdAt);
              const isUrgent = elapsed >= 10;
              const isMedium = elapsed >= 5 && elapsed < 10;

              return (
                <div
                  key={order.id}
                  className={`bg-stone-900/90 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition-all ${
                    isUrgent
                      ? 'border-red-500/60 shadow-red-500/10'
                      : isMedium
                      ? 'border-amber-500/60'
                      : 'border-stone-800 hover:border-stone-700'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between border-b ${
                      isUrgent
                        ? 'bg-red-500/15 border-red-500/30'
                        : isMedium
                        ? 'bg-amber-500/15 border-amber-500/30'
                        : 'bg-stone-850 border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300">
                          {order.orderType}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {order.tableNumber ? `Table ${order.tableNumber}` : 'Takeaway Counter'} • {order.customerName}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div
                        className={`flex items-center gap-1 font-mono font-extrabold text-xs px-2 py-1 rounded-lg ${
                          isUrgent
                            ? 'bg-red-500 text-white animate-pulse'
                            : isMedium
                            ? 'bg-amber-500 text-stone-950 font-bold'
                            : 'bg-stone-800 text-stone-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" /> {elapsed}m
                      </div>
                    </div>
                  </div>

                  {/* Items Checklist */}
                  <div className="p-4 flex-1 space-y-2.5 overflow-y-auto max-h-56">
                    {order.items.map((it) => {
                      const isDone = completedItemIds[it.id];
                      return (
                        <div
                          key={it.id}
                          onClick={() => toggleItemDone(it.id)}
                          className={`flex items-start justify-between p-2 rounded-xl cursor-pointer transition select-none ${
                            isDone
                              ? 'bg-emerald-500/10 border border-emerald-500/30 text-stone-400 line-through'
                              : 'bg-stone-950/80 border border-stone-800 text-stone-200 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-stone-800 text-amber-400 font-mono'
                              }`}
                            >
                              {it.quantity}x
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-stone-100">
                                {it.itemName}
                              </span>
                              {it.variantName && (
                                <span className="block text-[10px] text-amber-400">
                                  {it.variantName}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isDone ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-stone-700'
                            }`}
                          >
                            {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Action Footer */}
                  <div className="p-3 border-t border-stone-800 bg-stone-950/60 flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        Start Preparing
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Order Ready
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                        className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs transition"
                      >
                        Mark Served / Completed
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
