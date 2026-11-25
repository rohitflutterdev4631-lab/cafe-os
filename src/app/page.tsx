'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  ArrowRight,
  Coffee,
  Receipt,
  ChefHat,
  Package,
  Calendar,
  DollarSign,
  Bot,
  Users,
  Smartphone,
  Eye,
  Store,
  Shield,
  Layers,
  CheckCircle2,
  TrendingUp,
  TableProperties,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';

// Dynamic import of 3D Canvas preview on landing page
const CafeCanvas = dynamic(
  () => import('@/components/3d/CafeCanvas').then((mod) => mod.CafeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-stone-950 text-stone-400 space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <Coffee className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-xs font-semibold tracking-wider uppercase text-stone-300">
          Initializing 3D Digital Cafe Environment...
        </div>
      </div>
    ),
  }
);

export default function CafeOsHomePage() {
  const [activePreset, setActivePreset] = useState('OVERVIEW');
  const [sceneQuality, setSceneQuality] = useState<'high' | 'medium' | 'low'>('medium');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      setSceneQuality(isMobile ? 'low' : 'medium');
    }
  }, []);

  const demoTables = [
    {
      id: 'demo-1',
      tableNumber: '1',
      capacity: 4,
      status: 'OCCUPIED' as const,
      position: [1.5, 0, 0] as [number, number, number],
      currentOrder: { orderNumber: 'NC-8201', totalAmount: 640, durationMinutes: 24 },
    },
    {
      id: 'demo-2',
      tableNumber: '2',
      capacity: 2,
      status: 'AVAILABLE' as const,
      position: [4.0, 0, 0] as [number, number, number],
    },
    {
      id: 'demo-3',
      tableNumber: '3',
      capacity: 4,
      status: 'OCCUPIED' as const,
      position: [6.5, 0, 0] as [number, number, number],
      currentOrder: { orderNumber: 'NC-8204', totalAmount: 1120, durationMinutes: 38 },
    },
    {
      id: 'demo-4',
      tableNumber: '4',
      capacity: 4,
      status: 'RESERVED' as const,
      position: [1.5, 0, 3.5] as [number, number, number],
    },
    {
      id: 'demo-5',
      tableNumber: '5',
      capacity: 2,
      status: 'AVAILABLE' as const,
      position: [4.0, 0, 3.5] as [number, number, number],
    },
    {
      id: 'demo-6',
      tableNumber: '6',
      capacity: 6,
      status: 'AVAILABLE' as const,
      position: [6.5, 0, 3.5] as [number, number, number],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Top Glass Navigation Header */}
      <header className="sticky top-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xl shadow-amber-600/30 shrink-0">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white whitespace-nowrap">
                  CAFE <span className="text-amber-400">OS</span>
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-widest font-bold">
                  3D AI Platform
                </span>
              </div>
              <p className="text-[11px] text-stone-400 tracking-wide truncate hidden md:block">
                Immersive Hospitality Management Ecosystem
              </p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-stone-300">
            <a href="#3d-experience" className="hover:text-amber-400 transition">
              3D Environment
            </a>
            <a href="#pos-ecosystem" className="hover:text-amber-400 transition">
              POS & Inventory
            </a>
            <a href="#kds-kitchen" className="hover:text-amber-400 transition">
              Kitchen KDS
            </a>
            <a href="#ai-intelligence" className="hover:text-amber-400 transition">
              AI Co-Pilot
            </a>
            <Link href="/c/nordic-roast" className="hover:text-amber-400 transition flex items-center gap-1">
              Customer Menu <Smartphone className="w-3.5 h-3.5 text-amber-500" />
            </Link>
          </nav>

          {/* Launch Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold px-2.5 py-2 sm:px-4 sm:py-2.5 text-stone-300 hover:text-white hover:bg-stone-900 rounded-xl transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-extrabold px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
            >
              <span className="hidden xs:inline">Launch </span>3D HQ <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-14 sm:pb-20 overflow-hidden border-b border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation 3D Spatial Hospitality Software
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-tight">
            Step Into Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
              3D Digital Cafe
            </span>{' '}
            Headquarters.
          </h1>

          <p className="text-sm sm:text-lg lg:text-xl text-stone-400 max-w-3xl mx-auto leading-relaxed px-2">
            A complete, futuristic hospitality management ecosystem combining an interactive 3D cafe environment with enterprise POS, recipe-based ingredient inventory, kitchen display systems, live table allocations, and an AI business co-pilot.
          </p>

          {/* Direct Portals Launch Ribbon */}
          <div className="pt-2 sm:pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-600/30 transition flex items-center justify-center gap-2.5 text-xs sm:text-sm"
            >
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> Enter 3D Digital Headquarters
            </Link>
            <Link
              href="/dashboard/pos"
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> POS Terminal
            </Link>
            <Link
              href="/kitchen"
              className="flex-1 sm:flex-initial px-4 sm:px-6 py-3 sm:py-3.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" /> Kitchen KDS
            </Link>
            <Link
              href="/dashboard/ai"
              className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3.5 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 text-purple-200 font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" /> AI Business Co-Pilot
            </Link>
          </div>
        </div>

        {/* Embedded Interactive 3D Spatial Canvas Hero Viewport */}
        <div id="3d-experience" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mt-8 sm:mt-12">
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-stone-800 shadow-2xl bg-stone-950 h-[440px] sm:h-[500px] lg:h-[560px]">
            {/* Unified Responsive Top Overlay Toolbar */}
            <div className="absolute top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-4 z-20 flex items-center justify-between gap-2 pointer-events-none">
              {/* Overlay Camera Preset Toolbar */}
              <div className="pointer-events-auto flex items-center gap-1 bg-stone-950/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-stone-800 overflow-x-auto no-scrollbar shrink min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase px-1.5 sm:px-2 py-1 hidden sm:flex items-center shrink-0">
                  Camera:
                </span>
                {[
                  { id: 'OVERVIEW', label: 'Overview' },
                  { id: 'COUNTER_POS', label: 'Counter & POS' },
                  { id: 'DINING_FLOOR', label: 'Dining Floor' },
                  { id: 'KITCHEN', label: 'Kitchen KDS' },
                  { id: 'INVENTORY', label: 'Inventory' },
                  { id: 'OFFICE', label: 'Executive Office' },
                  { id: 'TOP_DOWN', label: 'Tactical View' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActivePreset(p.id)}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition whitespace-nowrap shrink-0 ${
                      activePreset === p.id
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Direct Launch Pill Overlay */}
              <div className="pointer-events-auto shrink-0">
                <Link
                  href="/dashboard"
                  className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-amber-600/95 hover:bg-amber-500 text-white text-[10px] sm:text-xs font-extrabold rounded-xl sm:rounded-2xl backdrop-blur-md shadow-xl flex items-center gap-1 sm:gap-1.5 transition whitespace-nowrap"
                >
                  <span className="hidden sm:inline">Expand Full Screen </span>3D Cockpit <ArrowRight className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                </Link>
              </div>
            </div>

            {/* Live 3D Scene */}
            <CafeCanvas
              activePreset={activePreset}
              onSelectZone={(zone) => {
                if (zone === 'POS') setActivePreset('COUNTER_POS');
                else if (zone === 'KITCHEN') setActivePreset('KITCHEN');
                else if (zone === 'INVENTORY') setActivePreset('INVENTORY');
                else if (zone === 'OFFICE') setActivePreset('OFFICE');
              }}
              onSelectTable={() => setActivePreset('DINING_FLOOR')}
              tables={demoTables}
              metrics={{ activeOrdersCount: 4, lowStockCount: 2, reservationCount: 3 }}
              quality={sceneQuality}
            />
          </div>
        </div>
      </section>

      {/* 5 Interconnected Core Pillars */}
      <section id="pos-ecosystem" className="py-20 border-b border-stone-850 bg-stone-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              An Elite Cafe Operating System
            </h2>
            <p className="text-stone-400 text-sm max-w-2xl mx-auto">
              Every persona in your restaurant ecosystem operates in seamless synchronization with real PostgreSQL data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: POS & Billing */}
            <div className="bg-stone-900/70 border border-stone-800 rounded-3xl p-6 space-y-4 hover:border-amber-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Touch POS & Billing</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Fast touchscreen interface with item search, dynamic variants, modifier groups, cash change calculation, UPI QR codes, split bills, and thermal receipt printing.
              </p>
              <Link
                href="/dashboard/pos"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
              >
                Launch POS Terminal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Recipe-Based Inventory */}
            <div className="bg-stone-900/70 border border-stone-800 rounded-3xl p-6 space-y-4 hover:border-blue-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Recipe-Based Inventory</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Connect dishes to exact ingredient recipes. Every espresso shot and latte automatically decrements grams of coffee beans and ml of milk with low-stock alerts.
              </p>
              <Link
                href="/dashboard/inventory"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300"
              >
                Inspect Inventory Racks <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: AI Business Assistant */}
            <div id="ai-intelligence" className="bg-stone-900/70 border border-stone-800 rounded-3xl p-6 space-y-4 hover:border-purple-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">AI Business Co-Pilot</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Conversational assistant grounded in live database sales, expenses, and inventory. Ask sales summaries, profit estimates, bestsellers, or generate WhatsApp campaign copy.
              </p>
              <Link
                href="/dashboard/ai"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300"
              >
                Ask Business Co-Pilot <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 4: Kitchen Display System (KDS) */}
            <div id="kds-kitchen" className="bg-stone-900/70 border border-stone-800 rounded-3xl p-6 space-y-4 hover:border-orange-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                <ChefHat className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Kitchen Display System (KDS)</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                High-contrast kitchen display with live elapsed timers, urgent delay highlights, item-level completion checkmarks, and audio chimes for new incoming tickets.
              </p>
              <Link
                href="/kitchen"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300"
              >
                Open Kitchen Display <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 5: Table & Floor Management */}
            <div className="bg-stone-900/70 border border-stone-800 rounded-3xl p-6 space-y-4 hover:border-emerald-500/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <TableProperties className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">3D Table & Floor Management</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Real floor plan showing table statuses (Available, Occupied, Reserved, Cleaning), live occupancy duration, active bills, table merging, and order transfer.
              </p>
              <Link
                href="/dashboard/tables"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300"
              >
                Manage Dining Floor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Persona Launchpad for Live Investor / Client Presentation */}
      <section className="py-16 border-b border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-extrabold text-white">Role-Specific Workspaces</h3>
            <p className="text-xs text-stone-400">
              Test each persona in real-time with live PostgreSQL data and zero mocks.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              href="/dashboard"
              className="p-5 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-3xl text-left transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-amber-400 transition">
                  Cafe Owner
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  3D Cockpit, P&L Net Margin, & AI Copilot
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/pos"
              className="p-5 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-3xl text-left transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition">
                  Cashier POS
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Order Entry, Modifiers, & Shift Drawer
                </div>
              </div>
            </Link>

            <Link
              href="/kitchen"
              className="p-5 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-3xl text-left transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-orange-400 transition">
                  Kitchen Staff
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Live Ticket Rail & Elapsed Timers
                </div>
              </div>
            </Link>

            <Link
              href="/c/nordic-roast"
              className="p-5 bg-stone-900 border border-stone-800 hover:border-amber-500/50 rounded-3xl text-left transition space-y-3 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-white group-hover:text-blue-400 transition">
                  Customer QR Menu
                </div>
                <div className="text-[11px] text-stone-400 mt-0.5">
                  Live Table Ordering & Digital Checkout
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-stone-950 border-t border-stone-850 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="font-extrabold text-stone-300">CAFE OS</span> • Spatial Hospitality Computing Platform
          </div>
          <div>
            © {new Date().getFullYear()} CAFE OS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
