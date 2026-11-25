'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  Clock,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Split,
  Combine,
} from 'lucide-react';
import { TableData } from '@/components/3d/DiningAreaMesh';

interface TableDetailModalProps {
  table: TableData | null;
  onClose: () => void;
  onOpenPosForTable: (tableNumber: string) => void;
  onUpdateTableStatus: (tableId: string, status: TableData['status']) => void;
}

export function TableDetailModal({
  table,
  onClose,
  onOpenPosForTable,
  onUpdateTableStatus,
}: TableDetailModalProps) {
  if (!table) return null;

  const [capacity, setCapacity] = useState(table.capacity);

  const isOccupied = table.status === 'OCCUPIED';
  const isAvailable = table.status === 'AVAILABLE';
  const isReserved = table.status === 'RESERVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl text-stone-100 no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-extrabold text-sm sm:text-base shrink-0">
              T{table.tableNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white">Table {table.tableNumber}</h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isAvailable
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isOccupied
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {table.status}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-400 truncate">Indoor Dining Area • Standard Section</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold">Capacity</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-sm text-stone-200">
              <Users className="w-4 h-4 text-amber-500" /> {capacity} Guests
            </div>
          </div>
          <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold">Occupancy</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-sm text-stone-200">
              <Clock className="w-4 h-4 text-blue-500" />
              {isOccupied && table.currentOrder ? `${table.currentOrder.durationMinutes}m` : '0m'}
            </div>
          </div>
          <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800">
            <span className="text-[10px] text-stone-500 uppercase font-semibold">Current Bill</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-sm text-amber-400 font-mono">
              ₹{isOccupied && table.currentOrder ? table.currentOrder.totalAmount : 0}
            </div>
          </div>
        </div>

        {/* Live Active Order Card if Occupied */}
        {isOccupied && table.currentOrder && (
          <div className="bg-stone-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-300">
                Active Ticket: {table.currentOrder.orderNumber}
              </span>
              <span className="text-amber-400 font-mono font-bold">
                ₹{table.currentOrder.totalAmount}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Order placed {table.currentOrder.durationMinutes} minutes ago. Kitchen has completed preparation.
            </p>
          </div>
        )}

        {/* Status Adjustment Radios */}
        <div className="space-y-1.5">
          <span className="text-xs text-stone-400 font-semibold">Change Status:</span>
          <div className="grid grid-cols-4 gap-2">
            {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onUpdateTableStatus(table.id, s)}
                className={`py-2 rounded-xl text-[11px] font-bold border transition ${
                  table.status === s
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-stone-800/80 border-stone-700/80 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenPosForTable(table.tableNumber);
            }}
            className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/30 text-xs flex items-center justify-center gap-2 transition"
          >
            <Receipt className="w-4 h-4" /> Open POS at Table {table.tableNumber}
          </button>

          {isOccupied && (
            <button
              onClick={() => onUpdateTableStatus(table.id, 'AVAILABLE')}
              className="px-4 py-3 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 rounded-2xl font-bold text-xs transition"
            >
              Clear & Settle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
