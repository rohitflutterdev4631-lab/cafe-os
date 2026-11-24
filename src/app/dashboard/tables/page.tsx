'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TableProperties,
  Plus,
  QrCode,
  Download,
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { generateQRCodeDataUrl } from '@/lib/qr';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function DashboardTablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewQr, setPreviewQr] = useState<any>(null);
  const { success, error: toastError, info } = useToast();

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/v1/tables');
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
      }
    } catch {
      toastError('Error', 'Could not load tables.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, capacity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create table');

      success('Table Created', `Table ${tableNumber} is ready with QR code.`);
      setShowAddModal(false);
      setTableNumber('');
      setCapacity(4);
      fetchTables();
    } catch (err: any) {
      setError(err.message);
      toastError('Table Creation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQr = async (table: any) => {
    const fullUrl = `${window.location.origin}/qr/${table.qrCode?.token || ''}`;
    const dataUrl = await generateQRCodeDataUrl(fullUrl);
    setPreviewQr({
      tableNumber: table.tableNumber,
      fullUrl,
      dataUrl,
    });
  };

  const handleDeleteTable = async (tableId: string, tblNum: string) => {
    if (!confirm(`Are you sure you want to delete Table ${tblNum}?`)) return;
    try {
      await fetch(`/api/v1/tables/${tableId}`, { method: 'DELETE' });
      setTables(tables.filter((t) => t.id !== tableId));
      success('Table Deleted', `Table ${tblNum} was removed.`);
    } catch {
      toastError('Delete Failed', 'Could not delete table.');
    }
  };

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS Dining Room & QR Table Management
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Dining Tables & Floor Plan</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Manage your restaurant tables, seating capacity, real-time occupancy, and high-res table QRs.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Table
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-stone-900 rounded-2xl border border-stone-800 p-5 h-44 animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="bg-stone-900 p-12 text-center rounded-2xl border border-stone-800 text-stone-400 text-sm">
          No dining tables configured yet. Click "Add Table" to generate your first table QR code.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isOccupied = table.status === 'OCCUPIED';
            const activeOrderCount = table.orders?.length || 0;

            return (
              <div
                key={table.id}
                className={`bg-stone-900/90 rounded-2xl border p-5 shadow-lg transition flex flex-col justify-between hover:border-amber-500/50 ${
                  isOccupied
                    ? 'border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-extrabold text-xl text-stone-100">
                      Table {table.tableNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        isOccupied
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {table.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-stone-400">
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    <span>Capacity: {table.capacity} guests</span>
                  </div>

                  <div className="mt-2 text-xs text-stone-400">
                    {activeOrderCount > 0 ? (
                      <span className="text-amber-400 font-semibold flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-amber-400" /> {activeOrderCount} Active Order
                      </span>
                    ) : (
                      <span className="text-stone-500">No active orders</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenQr(table)}
                    className="px-3 py-1.5 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Table QR
                  </button>

                  <button
                    onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                    className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition"
                    title="Delete table"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add New Dining Table"
          subtitle="Generates a unique QR token linked directly to this table."
          maxWidth="max-w-sm"
        >
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateTable} className="space-y-4 text-xs text-stone-200">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">
                Table Identifier *
              </label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 7 or Rooftop-01"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">
                Seating Capacity (Guests) *
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Table'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Code Preview Modal */}
      {previewQr && (
        <Modal
          isOpen={!!previewQr}
          onClose={() => setPreviewQr(null)}
          title={`Table ${previewQr.tableNumber} QR Code`}
          subtitle="Scan with mobile camera to test live ordering."
          maxWidth="max-w-sm"
          footer={
            <div className="flex items-center justify-center gap-2 w-full">
              <a
                href={previewQr.dataUrl}
                download={`Table-${previewQr.tableNumber}-QR.png`}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition"
              >
                <Download className="w-3.5 h-3.5" /> Download PNG
              </a>
              <button
                type="button"
                onClick={() => setPreviewQr(null)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850 transition"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="text-center space-y-3">
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 inline-block mx-auto">
              <img
                src={previewQr.dataUrl}
                alt="Table QR Code"
                className="w-48 h-48 mx-auto rounded-lg shadow-md"
              />
            </div>

            <p className="text-xs text-stone-400 font-mono break-all px-2">
              {previewQr.fullUrl}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
