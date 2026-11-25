'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Compass,
  Layers,
  LayoutDashboard,
  Receipt,
  ChefHat,
  Package,
  Calendar,
  Users,
  DollarSign,
  Bot,
  Settings,
  Eye,
  EyeOff,
  Maximize2,
  TrendingUp,
  TableProperties,
  ArrowRight,
  Shield,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Video,
  X,
  UtensilsCrossed,
  Laptop,
  Map,
  Footprints,
} from 'lucide-react';

export interface HudMetrics {
  todaySales: number;
  todayOrders: number;
  averageOrderValue: number;
  estimatedProfit: number;
  activeTables: number;
  totalTables: number;
  lowStockCount: number;
  activeTickets: number;
  activeReservations: number;
}

export interface SpatialHudProps {
  metrics: HudMetrics;
  activePreset: string;
  onSelectPreset: (preset: string) => void;
  onOpenModule: (moduleName: string) => void;
  onToggle2DMode: () => void;
  is2DMode: boolean;
  activeRole: string;
  onChangeRole: (role: string) => void;
  onTriggerDemoScenario?: (scenario: 'BUSY_EVENING' | 'QUIET_MORNING' | 'DEFAULT') => void;
  quality: 'high' | 'medium' | 'low';
  onChangeQuality: (q: 'high' | 'medium' | 'low') => void;
  is360Active?: boolean;
  onToggle360?: () => void;
  orbitSpeed?: number;
  onChangeOrbitSpeed?: (speed: number) => void;
  isPaused360?: boolean;
  onTogglePause360?: () => void;
  isAutoTour?: boolean;
  onToggleAutoTour?: () => void;
}

export function SpatialHud({
  metrics,
  activePreset,
  onSelectPreset,
  onOpenModule,
  onToggle2DMode,
  is2DMode,
  activeRole,
  onChangeRole,
  onTriggerDemoScenario,
  quality,
  onChangeQuality,
  is360Active = false,
  onToggle360,
  orbitSpeed = 1.0,
  onChangeOrbitSpeed,
  isPaused360 = false,
  onTogglePause360,
  isAutoTour = false,
  onToggleAutoTour,
}: SpatialHudProps) {
  const [showMetrics, setShowMetrics] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const presets = [
    { id: 'OVERVIEW', label: 'Overview', icon: Compass },
    { id: 'COUNTER_POS', label: 'Counter & POS', icon: Coffee },
    { id: 'DINING_FLOOR', label: 'Dining Floor', icon: UtensilsCrossed },
    { id: 'KITCHEN', label: 'Kitchen KDS', icon: ChefHat },
    { id: 'INVENTORY', label: 'Inventory', icon: Package },
    { id: 'OFFICE', label: 'Executive Office', icon: Laptop },
    { id: 'TOP_VIEW', label: 'Top-Down', icon: Map },
    { id: 'WALKTHROUGH', label: 'Walkthrough', icon: Footprints },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-between p-2 sm:p-4 overflow-hidden">
      {/* =========================================================================
          TOP HEADER COCKPIT & PRESET NAVIGATION (Structured flow - zero collision)
          ========================================================================= */}
      <div className="flex flex-col gap-2 pointer-events-auto w-full z-40">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2 bg-stone-950/90 border border-stone-850/80 backdrop-blur-xl px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-xl">
          {/* Brand & Digital Headquarter Status */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/30 shrink-0">
              <Coffee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white whitespace-nowrap">
                  CAFE OS <span className="text-amber-400">3D</span>
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden xs:inline">HQ </span>LIVE
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-stone-400 font-mono truncate hidden sm:block">
                Nordic Roast • {currentTime}
              </p>
            </div>
          </div>

          {/* Right Utility Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 2D / 3D Mode Toggle Switch */}
            <button
              onClick={onToggle2DMode}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] sm:text-xs font-extrabold flex items-center gap-1 sm:gap-1.5 shadow-sm transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{is2DMode ? '3D Space' : '2D Mode'}</span>
            </button>

            {/* Role Switcher */}
            <div className="hidden lg:flex items-center bg-stone-900 border border-stone-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-stone-500 text-[10px] uppercase font-bold mr-1.5">Role:</span>
              <select
                value={activeRole}
                onChange={(e) => onChangeRole(e.target.value)}
                className="bg-transparent text-stone-200 font-bold focus:outline-none cursor-pointer"
              >
                <option value="OWNER" className="bg-stone-900">Owner View</option>
                <option value="MANAGER" className="bg-stone-900">Manager View</option>
                <option value="CASHIER" className="bg-stone-900">Cashier POS</option>
                <option value="CHEF" className="bg-stone-900">Kitchen Chef</option>
                <option value="INVENTORY" className="bg-stone-900">Inventory Mgr</option>
              </select>
            </div>

            {/* Quality Setting */}
            <div className="hidden xl:flex items-center bg-stone-900 border border-stone-800 rounded-xl px-2 py-1 text-[11px] text-stone-400">
              <select
                value={quality}
                onChange={(e) => onChangeQuality(e.target.value as any)}
                className="bg-transparent text-stone-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="high" className="bg-stone-900">3D High</option>
                <option value="medium" className="bg-stone-900">3D Med</option>
                <option value="low" className="bg-stone-900">3D Low</option>
              </select>
            </div>

            {/* Demo Rush Button */}
            {onTriggerDemoScenario && (
              <div className="hidden 2xl:flex items-center gap-1">
                <button
                  onClick={() => onTriggerDemoScenario('BUSY_EVENING')}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 rounded-xl text-[11px] font-semibold transition"
                  title="Simulate busy dinner rush with full tables and kitchen orders"
                >
                  ⚡ Rush Hour Demo
                </button>
              </div>
            )}

            {/* Show / Hide Metrics Ribbon Button */}
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-stone-900 hover:bg-stone-850 text-stone-300 hover:text-white border border-stone-800 transition flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold"
              title="Toggle Live Operational Metrics Ribbon"
            >
              {showMetrics ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                  <span className="hidden sm:inline text-[11px]">Hide Metrics</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-[11px]">Metrics</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Floating Preset Tabs Dock & 360 Video Dock */}
        {!is2DMode && (
          <div className="w-full flex flex-col items-center gap-1.5 max-w-full">
            {/* Segmented Pill Dock */}
            <div className="flex items-center gap-1 bg-stone-950/90 border border-stone-800/90 backdrop-blur-2xl px-2 py-1 sm:py-1.5 rounded-full shadow-2xl shadow-black/90 ring-1 ring-white/10 max-w-full overflow-x-auto no-scrollbar">
              {presets.map((p) => {
                const Icon = p.icon;
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPreset(p.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold transition-all duration-200 whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/40 ring-1 ring-amber-400 scale-[1.02]'
                        : 'text-stone-300 hover:text-white hover:bg-stone-900/80'
                    }`}
                  >
                    <Icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-amber-200' : 'text-stone-400'}`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}

              {/* Subtle Divider */}
              <div className="w-[1px] h-4 sm:h-5 bg-stone-800 mx-1 shrink-0" />

              {/* 360° Cinematic Video Orbit Button */}
              {onToggle360 && (
                <button
                  onClick={onToggle360}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    is360Active
                      ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/50 ring-1 ring-rose-400 animate-pulse'
                      : 'bg-stone-900 text-amber-300 hover:bg-stone-850 hover:text-white border border-amber-500/30'
                  }`}
                  title="Toggle continuous 360° Cinematic Video Orbit around this zone"
                >
                  <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{is360Active ? '360° Orbiting' : '360° Video'}</span>
                  {is360Active && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                </button>
              )}
            </div>

            {/* 360° Video Playback HUD Controller Bar (when 360 is active) */}
            {is360Active && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-stone-950/95 border border-amber-500/40 backdrop-blur-2xl shadow-2xl text-xs max-w-full overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1 text-rose-400 font-mono font-bold tracking-wider text-[10px] sm:text-[11px] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>REC 360°</span>
                </div>

                <div className="w-[1px] h-3 bg-stone-800 shrink-0" />

                {/* Play / Pause Toggle */}
                {onTogglePause360 && (
                  <button
                    onClick={onTogglePause360}
                    className="p-1 rounded-full hover:bg-stone-850 text-stone-200 hover:text-white transition flex items-center gap-1 shrink-0"
                    title={isPaused360 ? 'Resume 360 Orbit' : 'Pause 360 Orbit'}
                  >
                    {isPaused360 ? (
                      <>
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-300 font-bold">Resume</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] text-amber-300 font-bold">Pause</span>
                      </>
                    )}
                  </button>
                )}

                <div className="w-[1px] h-3 bg-stone-800 shrink-0" />

                {/* Orbit Speed Selectors: 0.5x, 1x, 2x */}
                {onChangeOrbitSpeed && (
                  <div className="flex items-center bg-stone-900 rounded-full px-1 py-0.5 border border-stone-800 text-[10px] shrink-0">
                    {[0.5, 1.0, 2.0].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => onChangeOrbitSpeed(spd)}
                        className={`px-1.5 py-0.5 rounded-full font-mono transition ${
                          orbitSpeed === spd
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-[1px] h-3 bg-stone-800 shrink-0" />

                {/* Tour All Zones Automator */}
                {onToggleAutoTour && (
                  <button
                    onClick={onToggleAutoTour}
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                      isAutoTour
                        ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/30'
                        : 'text-stone-300 hover:text-white hover:bg-stone-850'
                    }`}
                    title="Tour all cafe zones automatically in sequence"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>{isAutoTour ? 'Touring' : 'Tour All'}</span>
                  </button>
                )}

                {/* Close 360 Mode */}
                {onToggle360 && (
                  <button
                    onClick={onToggle360}
                    className="p-1 text-stone-400 hover:text-white hover:bg-stone-850 rounded-full transition ml-0.5 shrink-0"
                    title="Exit 360 Video Mode"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Live Operational Metrics Ribbon (Collapsible) */}
        {showMetrics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-56 overflow-y-auto no-scrollbar">
            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Today's Gross
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-white font-mono">
                ₹{metrics.todaySales.toLocaleString()}
              </div>
            </div>

            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Orders & AOV
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-stone-200 font-mono">
                {metrics.todayOrders} <span className="text-[9px] sm:text-[10px] font-normal text-stone-400">(₹{metrics.averageOrderValue})</span>
              </div>
            </div>

            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Est. Net Profit
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono">
                ₹{metrics.estimatedProfit.toLocaleString()}
              </div>
            </div>

            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Floor Tables
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-amber-400">
                {metrics.activeTables} / {metrics.totalTables}{' '}
                <span className="text-[9px] sm:text-[10px] font-normal text-stone-400">occ</span>
              </div>
            </div>

            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Kitchen Tickets
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-orange-400">
                {metrics.activeTickets}{' '}
                <span className="text-[9px] sm:text-[10px] font-normal text-stone-400">live</span>
              </div>
            </div>

            <div className="bg-stone-950/85 border border-stone-800/80 backdrop-blur-md p-2 rounded-xl">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-stone-500">
                Restock Alerts
              </span>
              <div className="text-xs sm:text-sm font-extrabold text-amber-400 flex items-center gap-1">
                {metrics.lowStockCount}{' '}
                <span className="text-[9px] sm:text-[10px] font-normal text-stone-400">items</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          FLOATING BOTTOM NAVIGATION DOCK (Touch responsive with short labels)
          ========================================================================= */}
      <div className="pointer-events-auto self-center mt-auto w-full max-w-4xl bg-stone-950/95 border border-stone-850/90 backdrop-blur-2xl p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-start sm:justify-between gap-1 overflow-x-auto no-scrollbar mb-1 sm:mb-2">
        {[
          { id: 'POS', label: 'POS Terminal', shortLabel: 'POS', icon: Receipt, color: 'text-amber-400' },
          { id: 'TABLES', label: 'Tables & Floor', shortLabel: 'Tables', icon: TableProperties, color: 'text-emerald-400' },
          { id: 'KITCHEN', label: 'Kitchen KDS', shortLabel: 'KDS', icon: ChefHat, color: 'text-orange-400' },
          { id: 'INVENTORY', label: 'Inventory', shortLabel: 'Stock', icon: Package, color: 'text-blue-400' },
          { id: 'RESERVATIONS', label: 'Bookings', shortLabel: 'Bookings', icon: Calendar, color: 'text-indigo-400' },
          { id: 'AI', label: 'AI Assistant', shortLabel: 'AI Copilot', icon: Sparkles, color: 'text-purple-400' },
          { id: 'EXPENSES', label: 'Expenses & COGS', shortLabel: 'Expenses', icon: DollarSign, color: 'text-rose-400' },
          { id: 'SHIFTS', label: 'Cash Drawer', shortLabel: 'Drawer', icon: Shield, color: 'text-teal-400' },
        ].map((mod) => {
          const Icon = mod.icon;
          return (
            <button
              key={mod.id}
              onClick={() => onOpenModule(mod.id)}
              className="flex-1 min-w-[58px] sm:min-w-0 py-1.5 sm:py-2 px-1 sm:px-2.5 rounded-xl sm:rounded-2xl hover:bg-stone-850/80 flex flex-col items-center gap-1 text-stone-300 hover:text-white transition group shrink-0"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-center group-hover:scale-110 transition shrink-0">
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${mod.color}`} />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                <span className="sm:hidden">{mod.shortLabel}</span>
                <span className="hidden sm:inline">{mod.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
