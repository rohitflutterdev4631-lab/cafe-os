'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  Printer,
  Search,
  Filter,
  AlertCircle,
  Loader2,
  RefreshCw,
  Bell,
  Eye,
  Volume2,
  VolumeX,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { soundFx } from '@/components/ui/AudioAlert';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function DashboardOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('Kitchen overwhelmed with peak rush');
  const previousPendingIdsRef = useRef<Set<string>>(new Set());
  const { success, error, info } = useToast();

  const fetchOrders = async (silent = false) => {
    try {
      const res = await fetch('/api/v1/orders');
      const data = await res.json();
      if (data.success) {
        const newOrders = data.orders || [];
        setOrders(newOrders);

        // Sound chime detection for newly arriving PENDING orders
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
            info('New Order Arrived', 'A new customer ticket has been placed.');
          }
        }
        previousPendingIdsRef.current = currentPendingIds;
      }
    } catch {
      if (!silent) error('Error', 'Could not load orders');
    } finally {
      setLoading(false);
    }
  };

  // Poll orders every 4 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const updateOrderStatus = async (orderId: string, status: string, cancelReason?: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, cancelReason }),
      });
      const data = await res.json();

      if (data.success) {
        if (soundEnabled && (status === 'READY' || status === 'COMPLETED')) {
          soundFx.orderReady();
        }
        success('Status Updated', `Order #${data.order.orderNumber} is now ${status}`);
        fetchOrders(true);
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status });
        }
      } else {
        error('Update Failed', data.error || 'Failed to update order status');
      }
    } catch {
      error('Network Error', 'Please check your connection');
    } finally {
      setUpdatingId(null);
      setRejectModalOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'ACCEPTED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'PREPARING':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'READY':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-stone-800 text-stone-300 border-stone-700';
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.status === activeTab;
  });

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS Telemetry & Dispatch
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">
            Live Orders Management
          </h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Real-time PostgreSQL polling with synthesized kitchen audio alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
              soundEnabled
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-stone-900 border-stone-800 text-stone-400'
            }`}
            title={soundEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime On' : 'Chime Off'}</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-800">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'kanban' ? 'bg-amber-600 text-white shadow-sm' : 'text-stone-400'
              }`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => fetchOrders()}
            className="p-2 border border-stone-800 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 transition shadow-sm"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (List Mode) */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-stone-850 text-sm">
          {['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'REJECTED'].map((tab) => {
            const count = tab === 'ALL' ? orders.length : orders.filter((o) => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                  activeTab === tab
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                    : 'bg-stone-900/80 border border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
                }`}
              >
                <span>{tab === 'PENDING' ? 'New Orders' : tab}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {(
            [
              { status: 'PENDING', label: 'New / Incoming', color: 'border-amber-500/30 bg-amber-950/10' },
              { status: 'PREPARING', label: 'In Kitchen Prep', color: 'border-orange-500/30 bg-orange-950/10' },
              { status: 'READY', label: 'Ready for Service', color: 'border-purple-500/30 bg-purple-950/10' },
              { status: 'COMPLETED', label: 'Completed / Billed', color: 'border-emerald-500/30 bg-emerald-950/10' },
            ] as const
          ).map((col) => {
            const colOrders = orders.filter((o) =>
              col.status === 'PREPARING'
                ? o.status === 'PREPARING' || o.status === 'ACCEPTED'
                : o.status === col.status
            );
            return (
              <div key={col.status} className={`p-4 rounded-2xl border ${col.color} flex flex-col min-h-[500px] bg-stone-900/60 backdrop-blur-md`}>
                <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-300">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                  {colOrders.length === 0 ? (
                    <div className="text-xs text-stone-500 text-center py-12">No orders in this stage</div>
                  ) : (
                    colOrders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => setSelectedOrder(ord)}
                        className={`bg-stone-900/90 p-3.5 rounded-xl border border-stone-800 shadow-md hover:border-amber-500/50 transition cursor-pointer space-y-2 ${
                          selectedOrder?.id === ord.id ? 'ring-2 ring-amber-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-300 text-xs">
                            {ord.orderNumber}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300">
                            {ord.orderType === 'DINE_IN' ? `T-${ord.tableNumber || '?'}` : ord.orderType}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-stone-200 truncate">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {ord.items.length} items • {formatCurrency(ord.totalAmount)}
                        </div>
                        {/* Quick action */}
                        <div className="pt-2 border-t border-stone-800 flex justify-end">
                          {ord.status === 'PENDING' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(ord.id, 'PREPARING');
                              }}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Prep
                            </button>
                          )}
                          {(ord.status === 'PREPARING' || ord.status === 'ACCEPTED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(ord.id, 'READY');
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Mark Ready
                            </button>
                          )}
                          {ord.status === 'READY' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(ord.id, 'COMPLETED');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {loading && orders.length === 0 ? (
              <div className="flex items-center justify-center py-20 bg-stone-900 rounded-2xl border border-stone-800">
                <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-stone-900 p-12 text-center rounded-2xl border border-stone-800 text-stone-400 text-sm">
                No orders found in {activeTab} status.
              </div>
            ) : (
              filteredOrders.map((ord) => {
                const itemCount = ord.items.reduce((acc: number, it: any) => acc + it.quantity, 0);
                return (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className={`bg-stone-900/90 p-5 rounded-2xl border transition cursor-pointer shadow-md ${
                      selectedOrder?.id === ord.id
                        ? 'border-amber-500 ring-2 ring-amber-500/20'
                        : 'border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="font-mono font-bold text-base text-stone-100">
                          {ord.orderNumber}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-800 text-amber-300">
                          {ord.orderType === 'DINE_IN' ? `Table ${ord.tableNumber || '-'}` : ord.orderType}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(
                            ord.status
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="text-left sm:text-right flex items-baseline sm:flex-col justify-between sm:justify-start gap-1">
                        <div className="font-extrabold text-base text-stone-100 font-mono">
                          {formatCurrency(ord.totalAmount)}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">{formatDateTime(ord.createdAt)}</div>
                      </div>
                    </div>

                    {/* Customer info & items */}
                    <div className="mt-3 text-xs text-stone-400 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-t border-stone-800 pt-2.5">
                      <div>
                        <span className="font-semibold text-stone-200">{ord.customerName}</span> (
                        {ord.customerPhone})
                      </div>
                      <div className="font-medium text-stone-400">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'} • Payment:{' '}
                        <span className="font-bold text-stone-200">{ord.paymentMethod}</span> (
                        {ord.paymentStatus})
                      </div>
                    </div>

                    {ord.notes && (
                      <div className="mt-2 text-xs bg-amber-950/40 border border-amber-500/30 text-amber-200 p-2 rounded-xl">
                        <strong>Customer note:</strong> {ord.notes}
                      </div>
                    )}

                    {/* Quick Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {ord.status === 'PENDING' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateOrderStatus(ord.id, 'ACCEPTED');
                              }}
                              disabled={updatingId === ord.id}
                              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                            >
                              Accept Order
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectModalOrder(ord);
                              }}
                              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {ord.status === 'ACCEPTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'PREPARING');
                            }}
                            disabled={updatingId === ord.id}
                            className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                          >
                            <ChefHat className="w-3.5 h-3.5" /> Start Preparing
                          </button>
                        )}

                        {ord.status === 'PREPARING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'READY');
                            }}
                            disabled={updatingId === ord.id}
                            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            Mark Ready for Serving
                          </button>
                        )}

                        {ord.status === 'READY' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateOrderStatus(ord.id, 'COMPLETED');
                            }}
                            disabled={updatingId === ord.id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete Order
                          </button>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="text-xs font-semibold text-stone-400 hover:text-amber-400 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Order Receipt & Details Panel */}
          <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-6 shadow-xl sticky top-6 h-fit">
            {selectedOrder ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-stone-800">
                  <div>
                    <div className="font-mono font-bold text-lg text-stone-100">
                      {selectedOrder.orderNumber}
                    </div>
                    <div className="text-xs text-stone-400 font-mono">{formatDateTime(selectedOrder.createdAt)}</div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition no-print"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Bill
                  </button>
                </div>

                {/* Printable Receipt Container */}
                <div id="printable-receipt" className="space-y-4 text-xs text-stone-300 font-mono">
                  <div className="text-center pb-2 border-b border-dashed border-stone-700">
                    <div className="font-bold text-sm text-stone-100">CAFE OS</div>
                    <div className="text-stone-400">Tax Invoice / Kitchen Receipt</div>
                    <div>Order #: {selectedOrder.orderNumber}</div>
                    <div>Type: {selectedOrder.orderType} {selectedOrder.tableNumber ? `(Table ${selectedOrder.tableNumber})` : ''}</div>
                  </div>

                  <div>
                    <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
                    <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
                    {selectedOrder.deliveryAddress && <div><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>}
                  </div>

                  {/* Items */}
                  <div className="border-t border-b border-dashed border-stone-700 py-2 space-y-2">
                    {selectedOrder.items.map((it: any) => (
                      <div key={it.id}>
                        <div className="flex justify-between font-bold text-stone-200">
                          <span>{it.quantity}x {it.itemName} {it.variantName ? `(${it.variantName})` : ''}</span>
                          <span>{formatCurrency(it.subtotalPrice)}</span>
                        </div>
                        {it.addons && it.addons.length > 0 && (
                          <div className="pl-4 text-[11px] text-stone-400">
                            {it.addons.map((ad: any) => (
                              <div key={ad.id} className="flex justify-between">
                                <span>+ {ad.addonName}</span>
                                <span>+{formatCurrency(ad.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total calculation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-stone-400">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.taxAmount > 0 && (
                      <div className="flex justify-between text-stone-400">
                        <span>GST / Taxes:</span>
                        <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm text-stone-100 pt-1 border-t border-dashed border-stone-700">
                      <span>TOTAL DUE:</span>
                      <span className="text-amber-400">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-stone-500 text-xs">
                <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-600" />
                Select any order on the left to inspect customer details or print KOT bill.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOrder && (
        <Modal
          isOpen={!!rejectModalOrder}
          onClose={() => setRejectModalOrder(null)}
          title={`Reject Order ${rejectModalOrder.orderNumber}`}
          subtitle="Customer will be notified of cancellation."
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-stone-200">
            <p className="text-stone-400">
              Select reason for rejecting this order:
            </p>
            <div className="space-y-2">
              {[
                'Kitchen overwhelmed with peak rush',
                'Ingredients or dish out of stock',
                'Kitchen closed for the day',
                'Customer requested cancellation',
              ].map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                    rejectionReason === reason
                      ? 'border-rose-500/50 bg-rose-950/40 text-rose-200 font-semibold'
                      : 'border-stone-800 hover:bg-stone-850'
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="text-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-stone-400 hover:bg-stone-850"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => updateOrderStatus(rejectModalOrder.id, 'REJECTED', rejectionReason)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
