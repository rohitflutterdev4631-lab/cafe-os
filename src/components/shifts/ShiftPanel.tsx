'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Lock,
  Unlock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CashShiftData {
  id: string;
  staffName: string;
  shiftType: string;
  openingCash: number;
  closingCash?: number | null;
  expectedCash?: number | null;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  cashDifference?: number | null;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  notes?: string | null;
}

interface ShiftPanelProps {
  onClose?: () => void;
}

export function ShiftPanel({ onClose }: ShiftPanelProps) {
  const [activeShift, setActiveShift] = useState<CashShiftData | null>(null);
  const [pastShifts, setPastShifts] = useState<CashShiftData[]>([]);
  const [loading, setLoading] = useState(true);

  // Open Shift Form
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState<number>(5000);
  const [shiftType, setShiftType] = useState('MORNING');

  // Close Shift Form
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState<number>(0);
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShifts = async () => {
    try {
      const res = await fetch('/api/v1/shifts');
      const data = await res.json();
      if (data.success) {
        setActiveShift(data.activeShift);
        setPastShifts(data.pastShifts || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleOpenShift = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN', openingCash: openingFloat, shiftType }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOpenModal(false);
        fetchShifts();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error opening shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', closingCash: actualCash, notes: closingNotes }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCloseModal(false);
        fetchShifts();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Error closing shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">
                  CASH DRAWER & SHIFT RECONCILIATION
                </h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeShift
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {activeShift ? 'Shift Active' : 'No Active Shift'}
                </span>
              </div>
              <p className="text-xs text-stone-400">Cash drawer float verification, end-of-day reconciliation, & audit trails</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!activeShift ? (
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" /> Start New Shift
              </button>
            ) : (
              <button
                onClick={() => {
                  setActualCash(activeShift.openingCash + activeShift.cashSales);
                  setShowCloseModal(true);
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" /> Reconcile & Close Shift
              </button>
            )}

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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Shift Card */}
          {activeShift ? (
            <div className="bg-stone-950 p-6 rounded-3xl border border-stone-800 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    Current Shift: {activeShift.shiftType}
                  </h3>
                  <p className="text-xs text-stone-400">
                    Opened by {activeShift.staffName} at {new Date(activeShift.openedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500 uppercase font-bold">Total Expected Cash</span>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">
                    ₹{(activeShift.openingCash + activeShift.cashSales).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold">Opening Float</span>
                  <div className="text-base font-bold text-stone-200 mt-1 font-mono">
                    ₹{activeShift.openingCash.toLocaleString()}
                  </div>
                </div>

                <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold">Cash Sales</span>
                  <div className="text-base font-bold text-amber-400 mt-1 font-mono">
                    ₹{activeShift.cashSales.toLocaleString()}
                  </div>
                </div>

                <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold">UPI Transactions</span>
                  <div className="text-base font-bold text-blue-400 mt-1 font-mono">
                    ₹{activeShift.upiSales.toLocaleString()}
                  </div>
                </div>

                <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-semibold">Card Machine</span>
                  <div className="text-base font-bold text-purple-400 mt-1 font-mono">
                    ₹{activeShift.cardSales.toLocaleString()}
                  </div>
                </div>
              </div>

              {activeShift.notes && (
                <p className="text-xs text-stone-400 bg-stone-900/40 p-2.5 rounded-xl border border-stone-800/80">
                  📝 {activeShift.notes}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-stone-950 p-8 rounded-3xl border border-stone-800 text-center space-y-3">
              <Shield className="w-12 h-12 text-stone-600 mx-auto" />
              <h3 className="font-extrabold text-base text-stone-300">Till is Currently Locked</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No active shift is running. Start a new shift to begin recording cash and register transactions.
              </p>
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Open Shift & Enter Float
              </button>
            </div>
          )}

          {/* Past Shift Reconciliation Audit Logs */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-stone-300">Historical Shift Audit Logs</h3>
            <div className="bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden shadow">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/90 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Shift & Staff</th>
                    <th className="py-3 px-4">Opened / Closed</th>
                    <th className="py-3 px-4 text-right">Cash Sales</th>
                    <th className="py-3 px-4 text-right">UPI & Card</th>
                    <th className="py-3 px-4 text-right">Difference</th>
                    <th className="py-3 px-4 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {pastShifts.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-900/40 transition">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-100">
                        <div>{s.shiftType} Shift</div>
                        <span className="text-[10px] text-stone-400 font-normal">{s.staffName}</span>
                      </td>
                      <td className="py-3 px-4 text-stone-400 font-sans">
                        {new Date(s.openedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-200">
                        ₹{s.cashSales.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-stone-300">
                        ₹{(s.upiSales + s.cardSales).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            (s.cashDifference || 0) === 0
                              ? 'text-emerald-400'
                              : (s.cashDifference || 0) < 0
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {(s.cashDifference || 0) === 0 ? 'Exact Match' : `₹${s.cashDifference}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">Open Cash Drawer & Shift</h3>
              <button
                onClick={() => setShowOpenModal(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-semibold block mb-1">Shift Type</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                >
                  <option value="MORNING">Morning Rush (08:00 - 16:00)</option>
                  <option value="EVENING">Evening Shift (16:00 - 23:00)</option>
                  <option value="NIGHT">Late Night (23:00 - Close)</option>
                  <option value="FULL_DAY">Full Day</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Opening Cash Float (₹)</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl font-mono text-sm text-white focus:outline-none"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Verify initial physical cash in the till before ringing sales.
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenShift}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 text-xs transition"
            >
              {isSubmitting ? 'Opening Till...' : 'Confirm Float & Unlock POS'}
            </button>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {showCloseModal && activeShift && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">Shift Closing & Drawer Count</h3>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-1">
                <div className="flex justify-between text-stone-400">
                  <span>Opening Float:</span>
                  <span className="font-mono">₹{activeShift.openingCash}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>Recorded Cash Sales:</span>
                  <span className="font-mono">₹{activeShift.cashSales}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-1 border-t border-stone-800">
                  <span>Expected Physical Cash:</span>
                  <span className="font-mono text-amber-400">
                    ₹{activeShift.openingCash + activeShift.cashSales}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">
                  Actual Physical Cash Counted (₹)
                </label>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl font-mono text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center bg-stone-950 p-2.5 rounded-xl border border-stone-800 font-bold">
                <span className="text-stone-400">Drawer Difference:</span>
                <span
                  className={`font-mono ${
                    actualCash - (activeShift.openingCash + activeShift.cashSales) === 0
                      ? 'text-emerald-400'
                      : actualCash - (activeShift.openingCash + activeShift.cashSales) < 0
                      ? 'text-red-400'
                      : 'text-amber-400'
                  }`}
                >
                  ₹{actualCash - (activeShift.openingCash + activeShift.cashSales)}
                </span>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Closing Notes / Handover</label>
                <input
                  type="text"
                  placeholder="e.g. Handed float to Evening Cashier"
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleCloseShift}
              disabled={isSubmitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 text-xs transition"
            >
              {isSubmitting ? 'Locking Shift...' : 'Lock Shift & Generate Audit Record'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
