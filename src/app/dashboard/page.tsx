'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Sparkles,
  LayoutDashboard,
  Receipt,
  ChefHat,
  Package,
  Calendar,
  DollarSign,
  Shield,
  Bot,
  Users,
  UtensilsCrossed,
  TableProperties,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { TableData } from '@/components/3d/DiningAreaMesh';
import { SpatialHud, HudMetrics } from '@/components/3d/SpatialHud';
import { PosInterface } from '@/components/pos/PosInterface';
import { TableDetailModal } from '@/components/tables/TableDetailModal';
import { KdsInterface } from '@/components/kds/KdsInterface';
import { InventoryManagement } from '@/components/inventory/InventoryManagement';
import { AiCafeAssistant } from '@/components/ai/AiCafeAssistant';
import { ReservationPanel } from '@/components/reservations/ReservationPanel';
import { ExpensePanel } from '@/components/expenses/ExpensePanel';
import { ShiftPanel } from '@/components/shifts/ShiftPanel';
import { formatCurrency } from '@/lib/utils';

// Dynamically import Three.js Canvas to eliminate SSR window/canvas issues
const CafeCanvas = dynamic(
  () => import('@/components/3d/CafeCanvas').then((mod) => mod.CafeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-stone-400 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase text-stone-300">
          Constructing 3D Spatial Cafe Environment...
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const [activePreset, setActivePreset] = useState<string>('OVERVIEW');
  const [is2DMode, setIs2DMode] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [posInitialTable, setPosInitialTable] = useState<string | undefined>(undefined);
  const [activeRole, setActiveRole] = useState('OWNER');
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');

  // 360° Cinematic Video Orbit State
  const [is360Active, setIs360Active] = useState(false);
  const [orbitSpeed, setOrbitSpeed] = useState(1.0);
  const [isPaused360, setIsPaused360] = useState(false);
  const [isAutoTour, setIsAutoTour] = useState(false);

  const tourZones = ['OVERVIEW', 'COUNTER_POS', 'DINING_FLOOR', 'KITCHEN', 'INVENTORY', 'OFFICE', 'TOP_VIEW'];

  const handleNextAutoTourZone = () => {
    setActivePreset((prev) => {
      const idx = tourZones.indexOf(prev);
      const nextIdx = (idx + 1) % tourZones.length;
      return tourZones[nextIdx];
    });
  };

  // Real-time Database Tables State
  const [tables, setTables] = useState<TableData[]>([
    {
      id: 'tbl-1',
      tableNumber: '1',
      capacity: 4,
      status: 'OCCUPIED',
      position: [1.5, 0, 0],
      currentOrder: { orderNumber: 'NC-8201', totalAmount: 640, durationMinutes: 24 },
    },
    {
      id: 'tbl-2',
      tableNumber: '2',
      capacity: 2,
      status: 'AVAILABLE',
      position: [4.0, 0, 0],
    },
    {
      id: 'tbl-3',
      tableNumber: '3',
      capacity: 4,
      status: 'OCCUPIED',
      position: [6.5, 0, 0],
      currentOrder: { orderNumber: 'NC-8204', totalAmount: 1120, durationMinutes: 38 },
    },
    {
      id: 'tbl-4',
      tableNumber: '4',
      capacity: 4,
      status: 'RESERVED',
      position: [1.5, 0, 3.5],
    },
    {
      id: 'tbl-5',
      tableNumber: '5',
      capacity: 2,
      status: 'AVAILABLE',
      position: [4.0, 0, 3.5],
    },
    {
      id: 'tbl-6',
      tableNumber: '6',
      capacity: 6,
      status: 'AVAILABLE',
      position: [6.5, 0, 3.5],
    },
  ]);

  // Operational Metrics
  const [metrics, setMetrics] = useState<HudMetrics>({
    todaySales: 34250,
    todayOrders: 42,
    averageOrderValue: 815,
    estimatedProfit: 14800,
    activeTables: 2,
    totalTables: 6,
    lowStockCount: 2,
    activeTickets: 4,
    activeReservations: 3,
  });

  const refreshLiveMetrics = async () => {
    try {
      const [analyticsRes, inventoryRes, reservationsRes] = await Promise.all([
        fetch('/api/v1/analytics/overview').then((r) => r.json()),
        fetch('/api/v1/inventory').then((r) => r.json()),
        fetch('/api/v1/reservations').then((r) => r.json()),
      ]);

      if (analyticsRes.success) {
        const stats = analyticsRes.stats || {};
        const lowCount = inventoryRes.metrics?.lowStockCount || 2;
        const resCount = reservationsRes.reservations?.length || 3;

        setMetrics({
          todaySales: stats.todayRevenue || 34250,
          todayOrders: stats.todayOrders || 42,
          averageOrderValue: stats.averageOrderValue || 815,
          estimatedProfit: Math.round((stats.todayRevenue || 34250) * 0.42),
          activeTables: tables.filter((t) => t.status === 'OCCUPIED').length,
          totalTables: tables.length,
          lowStockCount: lowCount,
          activeTickets: stats.activeOrdersCount || 4,
          activeReservations: resCount,
        });
      }
    } catch {}
  };

  useEffect(() => {
    refreshLiveMetrics();
  }, [tables]);

  // Click on 3D Zone triggers smooth camera preset transition + module open!
  const handleSelectZone = (zone: string) => {
    if (zone === 'POS') {
      setActivePreset('COUNTER_POS');
      setActiveModule('POS');
    } else if (zone === 'KITCHEN') {
      setActivePreset('KITCHEN');
      setActiveModule('KITCHEN');
    } else if (zone === 'INVENTORY') {
      setActivePreset('INVENTORY');
      setActiveModule('INVENTORY');
    } else if (zone === 'OFFICE') {
      setActivePreset('OFFICE');
      setActiveModule('AI');
    } else if (zone === 'RESERVATIONS') {
      setActivePreset('OVERVIEW');
      setActiveModule('RESERVATIONS');
    } else if (zone === 'MENU') {
      setActivePreset('COUNTER_POS');
      setActiveModule('POS');
    } else if (zone === 'STAFF') {
      setActivePreset('OVERVIEW');
      setActiveModule('SHIFTS');
    }
  };

  const handleSelectTable = (table: TableData) => {
    setActivePreset('DINING_FLOOR');
    setSelectedTable(table);
  };

  const handleUpdateTableStatus = (tableId: string, status: TableData['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status } : t))
    );
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable({ ...selectedTable, status });
    }
  };

  // Rush hour scenario simulation
  const handleTriggerDemoScenario = (scenario: 'BUSY_EVENING' | 'QUIET_MORNING' | 'DEFAULT') => {
    if (scenario === 'BUSY_EVENING') {
      setTables([
        {
          id: 'tbl-1',
          tableNumber: '1',
          capacity: 4,
          status: 'OCCUPIED',
          position: [1.5, 0, 0],
          currentOrder: { orderNumber: 'NC-8290', totalAmount: 940, durationMinutes: 18 },
        },
        {
          id: 'tbl-2',
          tableNumber: '2',
          capacity: 2,
          status: 'OCCUPIED',
          position: [4.0, 0, 0],
          currentOrder: { orderNumber: 'NC-8291', totalAmount: 480, durationMinutes: 12 },
        },
        {
          id: 'tbl-3',
          tableNumber: '3',
          capacity: 4,
          status: 'OCCUPIED',
          position: [6.5, 0, 0],
          currentOrder: { orderNumber: 'NC-8292', totalAmount: 1420, durationMinutes: 44 },
        },
        {
          id: 'tbl-4',
          tableNumber: '4',
          capacity: 4,
          status: 'OCCUPIED',
          position: [1.5, 0, 3.5],
          currentOrder: { orderNumber: 'NC-8293', totalAmount: 820, durationMinutes: 29 },
        },
        {
          id: 'tbl-5',
          tableNumber: '5',
          capacity: 2,
          status: 'OCCUPIED',
          position: [4.0, 0, 3.5],
          currentOrder: { orderNumber: 'NC-8294', totalAmount: 560, durationMinutes: 7 },
        },
        {
          id: 'tbl-6',
          tableNumber: '6',
          capacity: 6,
          status: 'RESERVED',
          position: [6.5, 0, 3.5],
        },
      ]);
      setMetrics((prev) => ({
        ...prev,
        todaySales: 58900,
        todayOrders: 78,
        activeTables: 5,
        activeTickets: 8,
      }));
    } else {
      refreshLiveMetrics();
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0C0A09] overflow-hidden select-none">
      {/* 3D Spatial Canvas or 2D Mode */}
      {!is2DMode ? (
        <div className="w-full h-full">
          <CafeCanvas
            activePreset={activePreset}
            onSelectZone={handleSelectZone}
            onSelectTable={handleSelectTable}
            tables={tables}
            metrics={{
              activeOrdersCount: metrics.activeTickets,
              lowStockCount: metrics.lowStockCount,
              reservationCount: metrics.activeReservations,
            }}
            quality={quality}
            is360Active={is360Active}
            orbitSpeed={orbitSpeed}
            isPaused360={isPaused360}
            isAutoTour={isAutoTour}
            onNextAutoTourZone={handleNextAutoTourZone}
          />
        </div>
      ) : (
        /* Full 2D Operations Dashboard Mode */
        <div className="w-full h-full overflow-y-auto p-6 space-y-6 text-stone-100 bg-stone-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> 2D Enterprise Operations View
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                CAFE OS HQ • Nordic Roast & Bakery
              </h1>
              <p className="text-xs text-stone-400">
                Full-feature 2D mode for maximum performance and touch control
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIs2DMode(false)}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-2"
              >
                <Eye className="w-4 h-4" /> Enter 3D Spatial Cafe
              </button>
            </div>
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { id: 'POS', label: 'POS Terminal', icon: Receipt, desc: 'Ring up orders', color: 'bg-amber-600/20 text-amber-400 border-amber-500/30' },
              { id: 'TABLES', label: 'Tables & Floor', icon: TableProperties, desc: 'Floor occupancy', color: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30' },
              { id: 'KITCHEN', label: 'Kitchen KDS', icon: ChefHat, desc: 'Live ticket queue', color: 'bg-orange-600/20 text-orange-400 border-orange-500/30' },
              { id: 'INVENTORY', label: 'Inventory & Recipes', icon: Package, desc: 'Ingredient stocks', color: 'bg-blue-600/20 text-blue-400 border-blue-500/30' },
              { id: 'AI', label: 'AI Business Assistant', icon: Bot, desc: 'Ask revenue & margin queries', color: 'bg-purple-600/20 text-purple-400 border-purple-500/30' },
              { id: 'RESERVATIONS', label: 'Reservations', icon: Calendar, desc: 'Seating calendar', color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' },
              { id: 'EXPENSES', label: 'Expenses & COGS', icon: DollarSign, desc: 'P&L net margin', color: 'bg-rose-600/20 text-rose-400 border-rose-500/30' },
              { id: 'SHIFTS', label: 'Cash Drawer', icon: Shield, desc: 'Shift reconciliation', color: 'bg-teal-600/20 text-teal-400 border-teal-500/30' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.id}
                  onClick={() => setActiveModule(card.id)}
                  className="bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer hover:bg-stone-850 transition duration-150 shadow-md group"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.color} border flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-stone-100 group-hover:text-amber-400 transition">
                    {card.label}
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">{card.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Tables Overview Grid in 2D Mode */}
          <div className="bg-stone-900/80 p-5 rounded-3xl border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base text-white">Live Floor Tables Status</h2>
              <span className="text-xs text-amber-400 font-mono font-bold">
                {tables.filter((t) => t.status === 'OCCUPIED').length} of {tables.length} Occupied
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {tables.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                    t.status === 'OCCUPIED'
                      ? 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                      : t.status === 'RESERVED'
                      ? 'bg-blue-500/10 border-blue-500/40 hover:bg-blue-500/20'
                      : 'bg-stone-950 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-white">Table {t.tableNumber}</span>
                    <span className="text-[10px] text-stone-400">{t.capacity}p</span>
                  </div>
                  <div className="mt-2 text-[11px] font-bold uppercase tracking-wider">
                    <span
                      className={
                        t.status === 'OCCUPIED'
                          ? 'text-amber-400'
                          : t.status === 'RESERVED'
                          ? 'text-blue-400'
                          : 'text-emerald-400'
                      }
                    >
                      {t.status}
                    </span>
                  </div>
                  {t.currentOrder && (
                    <div className="mt-1 text-xs text-stone-300 font-mono">
                      ₹{t.currentOrder.totalAmount} • {t.currentOrder.durationMinutes}m
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Spatial Glass HUD Cockpit Overlay (overlaid above 3D space) */}
      {!is2DMode && (
        <SpatialHud
          metrics={metrics}
          activePreset={activePreset}
          onSelectPreset={(preset) => {
            setActivePreset(preset);
          }}
          onOpenModule={(mod) => setActiveModule(mod)}
          onToggle2DMode={() => setIs2DMode(true)}
          is2DMode={is2DMode}
          activeRole={activeRole}
          onChangeRole={(r) => setActiveRole(r)}
          onTriggerDemoScenario={handleTriggerDemoScenario}
          quality={quality}
          onChangeQuality={(q) => setQuality(q)}
          is360Active={is360Active}
          onToggle360={() => setIs360Active(!is360Active)}
          orbitSpeed={orbitSpeed}
          onChangeOrbitSpeed={(spd) => setOrbitSpeed(spd)}
          isPaused360={isPaused360}
          onTogglePause360={() => setIsPaused360(!isPaused360)}
          isAutoTour={isAutoTour}
          onToggleAutoTour={() => setIsAutoTour(!isAutoTour)}
        />
      )}

      {/* Floating Operational Modals */}
      {activeModule === 'POS' && (
        <PosInterface
          initialTableNumber={posInitialTable}
          onClose={() => {
            setActiveModule(null);
            setPosInitialTable(undefined);
            setActivePreset('OVERVIEW');
          }}
          onOrderCreated={() => {
            refreshLiveMetrics();
          }}
        />
      )}

      {activeModule === 'KITCHEN' && (
        <KdsInterface
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
          onOrderUpdated={() => refreshLiveMetrics()}
        />
      )}

      {activeModule === 'INVENTORY' && (
        <InventoryManagement
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
        />
      )}

      {activeModule === 'AI' && (
        <AiCafeAssistant
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
        />
      )}

      {activeModule === 'RESERVATIONS' && (
        <ReservationPanel
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
        />
      )}

      {activeModule === 'EXPENSES' && (
        <ExpensePanel
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
        />
      )}

      {activeModule === 'SHIFTS' && (
        <ShiftPanel
          onClose={() => {
            setActiveModule(null);
            setActivePreset('OVERVIEW');
          }}
        />
      )}

      {/* Table Detail Modal when a table is selected */}
      {selectedTable && (
        <TableDetailModal
          table={selectedTable}
          onClose={() => {
            setSelectedTable(null);
            setActivePreset('OVERVIEW');
          }}
          onOpenPosForTable={(tableNum) => {
            setPosInitialTable(tableNum);
            setActiveModule('POS');
            setSelectedTable(null);
          }}
          onUpdateTableStatus={handleUpdateTableStatus}
        />
      )}
    </div>
  );
}
