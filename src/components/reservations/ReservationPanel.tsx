'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  X,
  Plus,
  Phone,
  Mail,
  AlertCircle,
  Bell,
  UtensilsCrossed,
} from 'lucide-react';

interface ReservationItem {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  guestCount: number;
  date: string;
  time: string;
  tableId?: string | null;
  status: string;
  specialRequests?: string | null;
  table?: { tableNumber: string; capacity: number } | null;
}

interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  queueNumber: number;
  status: string;
  estimatedWaitMinutes: number;
  notes?: string | null;
}

interface ReservationPanelProps {
  onClose?: () => void;
}

export function ReservationPanel({ onClose }: ReservationPanelProps) {
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RESERVATIONS' | 'WAITLIST'>('RESERVATIONS');
  const [loading, setLoading] = useState(true);

  // New Booking Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [tableId, setTableId] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isWaitlistForm, setIsWaitlistForm] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/v1/reservations');
      const data = await res.json();
      if (data.success) {
        setReservations(data.reservations);
        setWaitlist(data.waitlist);
        setTables(data.tables);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCreateBooking = async () => {
    if (!customerName || !customerPhone) {
      alert('Please provide customer name and phone');
      return;
    }

    try {
      const res = await fetch('/api/v1/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isWaitlist: isWaitlistForm,
          customerName,
          customerPhone,
          guestCount,
          date,
          time,
          tableId: tableId || null,
          specialRequests,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setCustomerName('');
        setCustomerPhone('');
        fetchReservations();
      }
    } catch (e: any) {
      alert('Failed to save reservation');
    }
  };

  const handleStatusChange = async (id: string, status: string, type: 'reservation' | 'waitlist' = 'reservation') => {
    try {
      await fetch('/api/v1/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, type }),
      });
      fetchReservations();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl text-stone-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-white tracking-tight">
                  RESERVATIONS & WAITLIST
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {reservations.length} Active Bookings
                </span>
              </div>
              <p className="text-xs text-stone-400">Guest seating schedules, floor allocations & queue notifications</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-stone-800 p-1 rounded-xl border border-stone-700/60">
              <button
                onClick={() => setActiveTab('RESERVATIONS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'RESERVATIONS' ? 'bg-blue-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Table Bookings ({reservations.length})
              </button>
              <button
                onClick={() => setActiveTab('WAITLIST')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'WAITLIST' ? 'bg-blue-600 text-white' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Live Waitlist ({waitlist.length})
              </button>
            </div>

            <button
              onClick={() => {
                setIsWaitlistForm(activeTab === 'WAITLIST');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New {activeTab === 'WAITLIST' ? 'Waitlist' : 'Reservation'}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'RESERVATIONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map((r) => {
                const isConfirmed = r.status === 'CONFIRMED';
                const isSeated = r.status === 'SEATED';

                return (
                  <div
                    key={r.id}
                    className="bg-stone-950 p-4 rounded-2xl border border-stone-800 hover:border-blue-500/50 transition duration-150 flex flex-col justify-between space-y-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-extrabold text-base text-stone-100">{r.customerName}</h3>
                          <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-500" /> {r.customerPhone}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isConfirmed
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : isSeated
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-stone-800 text-stone-400'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-stone-900/80 p-2.5 rounded-xl border border-stone-800/80">
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase font-semibold">Date & Time</span>
                          <div className="font-bold text-stone-200 mt-0.5">
                            {r.date} • {r.time}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-stone-500 uppercase font-semibold">Table & Party</span>
                          <div className="font-bold text-amber-400 mt-0.5">
                            {r.table ? `Table ${r.table.tableNumber}` : 'Unassigned'} ({r.guestCount}p)
                          </div>
                        </div>
                      </div>

                      {r.specialRequests && (
                        <p className="text-[11px] text-stone-400 italic mt-2 bg-stone-900/40 p-2 rounded-lg">
                          "{r.specialRequests}"
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-stone-800 flex gap-2">
                      {isConfirmed && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'SEATED')}
                          className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl transition"
                        >
                          Seat Guests
                        </button>
                      )}
                      {isSeated && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                          className="flex-1 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs rounded-xl transition"
                        >
                          Complete Booking
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(r.id, 'CANCELLED')}
                        className="px-3 py-2 bg-stone-800/80 hover:bg-red-500/20 hover:text-red-300 text-stone-500 font-semibold text-xs rounded-xl transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'WAITLIST' && (
            <div className="space-y-3">
              {waitlist.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-stone-500 space-y-2">
                  <Clock className="w-10 h-10 opacity-30" />
                  <p className="text-xs">No walk-in parties currently on waitlist.</p>
                </div>
              ) : (
                waitlist.map((w) => (
                  <div
                    key={w.id}
                    className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex flex-col items-center justify-center text-amber-400">
                        <span className="text-[10px] uppercase font-bold text-stone-500">Queue</span>
                        <span className="font-extrabold text-base leading-none">#{w.queueNumber}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-100 text-sm">{w.customerName}</h4>
                          <span className="text-xs text-stone-400">({w.guestCount} guests)</span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">{w.customerPhone} • {w.notes || 'No special requests'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        Est. Wait: ~{w.estimatedWaitMinutes} mins
                      </span>
                      <button
                        onClick={() => handleStatusChange(w.id, 'NOTIFIED', 'waitlist')}
                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Bell className="w-3.5 h-3.5" /> Notify Table Ready
                      </button>
                      <button
                        onClick={() => handleStatusChange(w.id, 'SEATED', 'waitlist')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition"
                      >
                        Seat Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Booking Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <h3 className="font-extrabold text-base text-white">
                {isWaitlistForm ? 'Add to Walk-in Waitlist' : 'Create Table Reservation'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 font-semibold block mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kunal Kapoor"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="+91 98200 00000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 font-semibold block mb-1">Party Size</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none font-mono"
                  />
                </div>
                {!isWaitlistForm && (
                  <div>
                    <label className="text-stone-400 font-semibold block mb-1">Table Assignment</label>
                    <select
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                    >
                      <option value="">Auto Assign</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          Table {t.tableNumber} ({t.capacity}p - {t.status})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!isWaitlistForm && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-stone-400 font-semibold block mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-stone-400 font-semibold block mb-1">Time</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-stone-400 font-semibold block mb-1">Special Requests / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Window booth, high chair"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleCreateBooking}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 text-xs transition"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
