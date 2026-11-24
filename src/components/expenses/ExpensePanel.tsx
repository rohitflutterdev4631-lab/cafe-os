'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  X,
  Plus,
  Receipt,
  FileText,
  PieChart,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ExpenseItem {
  id: string;
  category: string;
  title: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: string;
  approvedBy?: string | null;
  notes?: string | null;
}

interface FinancialSummary {
  totalRevenue: number;
  estimatedCogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalExpenses: number;
  netProfit: number;
  netMarginPercent: number;
}

interface ExpensePanelProps {
  onClose?: () => void;
}

export function ExpensePanel({ onClose }: ExpensePanelProps) {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<Record<string, number>>({});
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('RAW_MATERIALS');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await fetch('/api/v1/expenses');
      const data = await res.json();
      if (data.success) {
        setExpenses(data.expenses);
        setCategoryTotals(data.categoryTotals);
        setSummary(data.financialSummary);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!title || !amount) {
      alert('Please provide title and amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, title, amount, paymentMethod, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setTitle('');
        setAmount(0);
        setNotes('');
        fetchExpenses();
      }
    } catch {
      alert('Failed to log expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">
                  EXPENSES & PROFITABILITY (P&L)
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Real COGS vs Net Profit
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Operating expenditures, commercial lease, utility bills, & true net margins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Record Expense
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

        {/* 30-Day Financial Performance Ribbon */}
        {summary && (
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-stone-800 bg-stone-950/40">
            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-500">Gross 30D Revenue</span>
              <div className="text-lg font-extrabold text-white mt-0.5 font-mono">
                ₹{summary.totalRevenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-500">Est. Raw COGS</span>
              <div className="text-lg font-extrabold text-amber-400 mt-0.5 font-mono">
                -₹{summary.estimatedCogs.toLocaleString()}{' '}
                <span className="text-xs font-normal text-stone-400">({summary.grossMarginPercent}% gross)</span>
              </div>
            </div>

            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-500">Fixed Operating Exp</span>
              <div className="text-lg font-extrabold text-rose-400 mt-0.5 font-mono">
                -₹{summary.totalExpenses.toLocaleString()}
              </div>
            </div>

            <div className="bg-stone-900/80 p-3 rounded-2xl border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400">Estimated Net Profit</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5 font-mono">
                ₹{summary.netProfit.toLocaleString()}{' '}
                <span className="text-xs font-normal text-emerald-300">({summary.netMarginPercent}% net)</span>
              </div>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden shadow">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/90 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-stone-900/40 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-stone-100">
                      <div>{e.title}</div>
                      {e.notes && <span className="text-[10px] text-stone-500 font-sans italic">{e.notes}</span>}
                    </td>
                    <td className="py-3 px-4 font-sans text-stone-400">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-[10px] font-semibold">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-400">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-sans text-stone-400">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-stone-100 font-mono">
                      ₹{e.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">Record Operating Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-semibold block mb-1">Expense Title</label>
                <input
                  type="text"
                  placeholder="e.g. Arabica beans restock invoice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 font-semibold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                  >
                    <option value="RAW_MATERIALS">Raw Materials (COGS)</option>
                    <option value="RENT">Rent & Lease</option>
                    <option value="ELECTRICITY">Electricity & Gas</option>
                    <option value="SALARY">Salaries & Wages</option>
                    <option value="PACKAGING">Packaging / Cups</option>
                    <option value="MARKETING">Marketing & Ads</option>
                    <option value="MAINTENANCE">Equipment Repair</option>
                    <option value="OTHER">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="text-stone-400 font-semibold block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                >
                  <option value="BANK_TRANSFER">Bank RTGS / NEFT</option>
                  <option value="UPI">UPI Direct</option>
                  <option value="CASH">Cash Till</option>
                  <option value="CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Notes / Vendor</label>
                <input
                  type="text"
                  placeholder="Optional notes or invoice #..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAddExpense}
              disabled={isSubmitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-600/30 text-xs transition"
            >
              {isSubmitting ? 'Logging Expense...' : 'Save & Deduct from P&L'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
