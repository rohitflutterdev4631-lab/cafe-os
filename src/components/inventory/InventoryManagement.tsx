'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  Plus,
  Minus,
  TrendingDown,
  RefreshCw,
  X,
  Layers,
  FileText,
  DollarSign,
  Coffee,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InventoryItemData {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock?: number | null;
  unit: string;
  costPerUnit: number;
  isLowStock: boolean;
  expiryDate?: string | null;
  batchNumber?: string | null;
  supplier?: { id: string; name: string; phone?: string | null } | null;
  recipeIngredients?: {
    quantity: number;
    unit: string;
    menuItem: { id: string; name: string; basePrice: number };
  }[];
}

interface InventoryManagementProps {
  onClose?: () => void;
  onOpenPurchaseOrders?: () => void;
}

export function InventoryManagement({ onClose, onOpenPurchaseOrders }: InventoryManagementProps) {
  const [items, setItems] = useState<InventoryItemData[]>([]);
  const [metrics, setMetrics] = useState<{ totalItems: number; lowStockCount: number; totalValuation: number }>({
    totalItems: 0,
    lowStockCount: 0,
    totalValuation: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'STOCK' | 'RECIPES' | 'WASTAGE'>('STOCK');

  // Adjustment modal
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItemData | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(100);
  const [adjustReason, setAdjustReason] = useState<string>('Restock delivery intake');
  const [adjustType, setAdjustType] = useState<'PURCHASE' | 'WASTAGE' | 'ADJUSTMENT'>('PURCHASE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/v1/inventory');
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setMetrics(data.metrics);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleApplyAdjustment = async () => {
    if (!selectedItemForAdjust) return;
    setIsSubmitting(true);
    try {
      const delta = adjustType === 'WASTAGE' ? -Math.abs(adjustAmount) : Number(adjustAmount);
      const res = await fetch('/api/v1/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedItemForAdjust.id,
          adjustment: delta,
          reason: adjustReason,
          type: adjustType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInventory();
        setSelectedItemForAdjust(null);
      } else {
        alert(data.error || 'Failed to update stock');
      }
    } catch (e: any) {
      alert('Error updating inventory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">
                  INVENTORY & RECIPES
                </h1>
                {metrics.lowStockCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {metrics.lowStockCount} Reorder Alerts
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Ingredient tracking, automated recipe deductions, & supplier purchasing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-stone-800/80 p-1 rounded-xl border border-stone-700/60">
              <button
                onClick={() => setActiveTab('STOCK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'STOCK' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Stock List
              </button>
              <button
                onClick={() => setActiveTab('RECIPES')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'RECIPES' ? 'bg-emerald-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Recipe Deductions
              </button>
            </div>

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

        {/* Metrics Row */}
        <div className="p-4 grid grid-cols-3 gap-4 border-b border-stone-800 bg-stone-950/40">
          <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Total Ingredients
              </span>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {metrics.totalItems} Items
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Low Stock Thresholds
              </span>
              <div className="text-xl font-extrabold text-amber-400 mt-0.5">
                {metrics.lowStockCount} Items
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                Inventory Valuation
              </span>
              <div className="text-xl font-extrabold text-emerald-400 mt-0.5 font-mono">
                ₹{metrics.totalValuation.toLocaleString()}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'STOCK' && (
            <div className="bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden shadow">
              <table className="w-full text-left text-xs text-stone-300">
                <thead className="bg-stone-900/90 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Min Threshold</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {items.map((item) => {
                    const isLow = item.currentStock <= item.minStock;
                    return (
                      <tr key={item.id} className="hover:bg-stone-900/40 transition">
                        <td className="py-3 px-4 font-sans font-semibold text-stone-100">
                          <div>{item.name}</div>
                          <span className="text-[10px] text-stone-500 font-mono">{item.sku}</span>
                        </td>
                        <td className="py-3 px-4 font-sans text-stone-400">
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] font-semibold">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={isLow ? 'text-amber-400 font-extrabold' : 'text-stone-100'}>
                            {item.currentStock.toLocaleString()} {item.unit}
                          </span>
                          {isLow && (
                            <span className="block text-[9px] text-red-400 font-sans uppercase">
                              Low Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-stone-400">
                          {item.minStock.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-3 px-4 text-right text-stone-300">
                          ₹{item.costPerUnit}
                        </td>
                        <td className="py-3 px-4 font-sans text-stone-400">
                          {item.supplier?.name || 'Local Direct'}
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <button
                            onClick={() => {
                              setSelectedItemForAdjust(item);
                              setAdjustAmount(item.unit === 'GRAM' ? 1000 : 10);
                            }}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'RECIPES' && (
            <div className="space-y-4">
              <div className="bg-stone-950/80 p-4 rounded-2xl border border-stone-800 text-xs text-stone-400">
                💡 <strong className="text-stone-200">Automated Recipe Deductions:</strong> Every time an order is processed via the POS or customer QR menu, the exact ingredient ratios configured below are automatically decremented from live PostgreSQL stock.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items
                  .filter((i) => i.recipeIngredients && i.recipeIngredients.length > 0)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                        <span className="font-extrabold text-sm text-amber-400">{item.name}</span>
                        <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-400 font-mono">
                          {item.sku}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] text-stone-500 uppercase font-semibold">
                          Linked Menu Items:
                        </span>
                        {item.recipeIngredients?.map((ri, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-stone-900/80 p-2 rounded-xl"
                          >
                            <span className="font-medium text-stone-200">
                              {ri.menuItem.name}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              -{ri.quantity} {ri.unit} / serving
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">
                Adjust: {selectedItemForAdjust.name}
              </h3>
              <button
                onClick={() => setSelectedItemForAdjust(null)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-semibold block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PURCHASE', 'WASTAGE', 'ADJUSTMENT'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAdjustType(t)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        adjustType === t
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-750'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">
                  Quantity ({selectedItemForAdjust.unit})
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl font-mono text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Reason / Reference</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleApplyAdjustment}
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition text-xs"
            >
              {isSubmitting ? 'Updating Database...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
