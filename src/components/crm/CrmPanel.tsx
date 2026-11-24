'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Star,
  MessageSquare,
  Gift,
  X,
  Plus,
  Search,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  TrendingUp,
} from 'lucide-react';

interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  tier: string;
  birthday?: string | null;
  notes?: string | null;
  orders?: any[];
}

interface FeedbackRecord {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  comments?: string | null;
  aiSentiment?: string | null;
  aiSummary?: string | null;
  managerReply?: string | null;
  status: string;
  createdAt: string;
}

interface CrmPanelProps {
  onClose?: () => void;
}

export function CrmPanel({ onClose }: CrmPanelProps) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [segments, setSegments] = useState<any>({ vip: 0, gold: 0, returning: 0, new: 0 });
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'FEEDBACK'>('CUSTOMERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Points adjustment modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [pointDelta, setPointDelta] = useState<number>(50);
  const [pointReason, setPointReason] = useState('Birthday VIP Bonus');

  // Reply modal
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchCrmData = async () => {
    try {
      const res = await fetch('/api/v1/crm');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        setFeedbacks(data.feedbacks);
        setSegments(data.segments);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  const handleAdjustPoints = async () => {
    if (!selectedCustomer) return;
    try {
      const res = await fetch('/api/v1/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADJUST_POINTS',
          customerId: selectedCustomer.id,
          points: pointDelta,
          notes: pointReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCustomer(null);
        fetchCrmData();
      }
    } catch {
      alert('Error updating points');
    }
  };

  const handleSendReply = async () => {
    if (!selectedFeedback) return;
    try {
      const res = await fetch('/api/v1/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLY_FEEDBACK',
          feedbackId: selectedFeedback.id,
          reply: replyText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedFeedback(null);
        setReplyText('');
        fetchCrmData();
      }
    } catch {
      alert('Error sending reply');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">
                  CUSTOMER CRM & LOYALTY CLUB
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {customers.length} Registered Guests
                </span>
              </div>
              <p className="text-xs text-stone-400">Patron spending histories, VIP tiers, points wallet, & review intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700/60">
              <button
                onClick={() => setActiveTab('CUSTOMERS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'CUSTOMERS' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Guest Directory
              </button>
              <button
                onClick={() => setActiveTab('FEEDBACK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'FEEDBACK' ? 'bg-amber-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                QR Feedback ({feedbacks.length})
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

        {/* Tier Badges Ribbon */}
        <div className="p-4 grid grid-cols-4 gap-3 border-b border-stone-800 bg-stone-950/40">
          <div className="bg-stone-900/80 p-3 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400">VIP Club (500+ pts)</span>
              <div className="text-lg font-extrabold text-white mt-0.5">{segments.vip} Guests</div>
            </div>
            <Award className="w-6 h-6 text-amber-400" />
          </div>

          <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400">Gold Tier</span>
              <div className="text-lg font-extrabold text-white mt-0.5">{segments.gold} Guests</div>
            </div>
            <Star className="w-6 h-6 text-yellow-500" />
          </div>

          <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400">Returning Patrons</span>
              <div className="text-lg font-extrabold text-white mt-0.5">{segments.returning} Guests</div>
            </div>
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>

          <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400">New Guests</span>
              <div className="text-lg font-extrabold text-white mt-0.5">{segments.new} Guests</div>
            </div>
            <Users className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'CUSTOMERS' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search guests by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none"
                />
              </div>

              <div className="bg-stone-950/60 rounded-2xl border border-stone-800 overflow-hidden shadow">
                <table className="w-full text-left text-xs text-stone-300">
                  <thead className="bg-stone-900/90 text-stone-400 uppercase tracking-wider text-[10px] border-b border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Guest Name</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4 text-center">Tier</th>
                      <th className="py-3 px-4 text-right">Points Wallet</th>
                      <th className="py-3 px-4 text-right">Total Spend</th>
                      <th className="py-3 px-4 text-center">Visits</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-900/40 transition">
                        <td className="py-3 px-4 font-sans font-semibold text-stone-100">
                          <div>{c.name}</div>
                          {c.notes && <span className="text-[10px] text-stone-500 font-normal italic">{c.notes}</span>}
                        </td>
                        <td className="py-3 px-4 text-stone-400">{c.phone}</td>
                        <td className="py-3 px-4 text-center font-sans">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              c.tier === 'VIP'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : c.tier === 'GOLD'
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-stone-800 text-stone-400'
                            }`}
                          >
                            {c.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-amber-400">
                          {c.loyaltyPoints} pts
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-stone-100">
                          ₹{c.totalSpent.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center text-stone-300">{c.visitCount}x</td>
                        <td className="py-3 px-4 text-center font-sans">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition"
                          >
                            Adjust Points
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'FEEDBACK' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-stone-100">{f.customerName}</h4>
                      <div className="flex items-center gap-1 text-amber-400 mt-0.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < f.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {f.aiSentiment && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                          f.aiSentiment === 'POSITIVE'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        AI: {f.aiSentiment}
                      </span>
                    )}
                  </div>

                  {f.comments && (
                    <p className="text-xs text-stone-300 bg-stone-900/60 p-3 rounded-xl border border-stone-800/80 leading-relaxed">
                      "{f.comments}"
                    </p>
                  )}

                  {f.managerReply ? (
                    <div className="text-[11px] bg-stone-900/90 p-2.5 rounded-xl border border-stone-800 text-stone-400">
                      <strong className="text-amber-400">Manager Response:</strong> {f.managerReply}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedFeedback(f);
                        setReplyText(
                          `Dear ${f.customerName}, thank you so much for visiting Nordic Roast! We deeply appreciate your review and look forward to welcoming you back soon.`
                        );
                      }}
                      className="w-full py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Generate AI Reply Draft
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adjust Points Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">
                Adjust Points: {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 bg-stone-950 rounded-xl border border-stone-800">
                <span className="text-stone-400">Current Balance:</span>
                <span className="font-mono font-bold text-amber-400">
                  {selectedCustomer.loyaltyPoints} Points
                </span>
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">
                  Points To Add / Deduct (+/-)
                </label>
                <input
                  type="number"
                  value={pointDelta}
                  onChange={(e) => setPointDelta(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl font-mono text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Reason / Campaign</label>
                <input
                  type="text"
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleAdjustPoints}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/30 text-xs transition"
            >
              Confirm Point Adjustment
            </button>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">Approve & Send Review Response</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-xl text-stone-200 focus:outline-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleSendReply}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-2xl shadow-lg shadow-purple-600/30 text-xs transition"
            >
              Approve & Dispatch Response
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
