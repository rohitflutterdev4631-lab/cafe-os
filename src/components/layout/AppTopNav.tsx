'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Bell,
  Search,
  ExternalLink,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Coffee,
  X,
} from 'lucide-react';

interface AppTopNavProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  cafe?: {
    name: string;
    slug: string;
  } | null;
  onToggleSidebar?: () => void;
  breadcrumbs?: { label: string; href?: string }[];
  accentColor?: string;
}

export function AppTopNav({
  user,
  cafe,
  onToggleSidebar,
  breadcrumbs,
}: AppTopNavProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Auto-generate breadcrumbs if not provided
  const segments = pathname.split('/').filter(Boolean);
  const derivedCrumbs = breadcrumbs || [
    { label: segments[0] === 'admin' ? 'Super Admin' : 'CAFE OS Dashboard', href: `/${segments[0]}` },
    ...segments.slice(1).map((seg, idx) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: `/${segments.slice(0, idx + 2).join('/')}`,
    })),
  ];

  return (
    <>
      <header className="h-16 bg-[#0C0A09]/95 border-b border-stone-850 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-xl">
        {/* Left: Mobile hamburger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="p-2 text-stone-400 hover:text-stone-100 hover:bg-stone-900 rounded-xl transition md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center text-xs font-medium text-stone-400 gap-1.5">
            {derivedCrumbs.map((crumb, idx) => {
              const isLast = idx === derivedCrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-600" />}
                  {crumb.href && !isLast ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-amber-400 transition py-1 text-stone-400"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-stone-200 py-1">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right side: Quick Search trigger, Notifications, Live Public Link & Role badge */}
        <div className="flex items-center gap-2.5">
          {/* Quick Search Trigger */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-stone-900/80 hover:bg-stone-850 text-stone-400 hover:text-stone-200 rounded-xl border border-stone-800 text-xs transition"
          >
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Search or jump to...</span>
            <span className="text-[10px] bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded font-mono text-stone-400">
              ⌘K
            </span>
          </button>

          {/* Customer preview link */}
          {cafe && (
            <Link
              href={`/c/${cafe.slug}`}
              target="_blank"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 transition"
            >
              <span>Customer Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          {/* Live System Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-full text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>HQ ONLINE</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-xl transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-stone-950" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-stone-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-stone-800 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-stone-800 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wider text-stone-400">
                    Notifications & Telemetry
                  </span>
                  <span className="text-[11px] text-amber-400 font-semibold cursor-pointer">
                    Clear all
                  </span>
                </div>
                <div className="divide-y divide-stone-800/80 max-h-72 overflow-y-auto">
                  <div className="p-3.5 hover:bg-stone-850/60 transition flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-stone-200">
                        Prisma Engine & Postgres Synced
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Inventory recipes and auto-deduction active.
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono mt-1 block">Live</span>
                    </div>
                  </div>
                  <div className="p-3.5 hover:bg-stone-850/60 transition flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-stone-200">
                        3D Digital Twin Synchronized
                      </div>
                      <div className="text-[11px] text-stone-400 mt-0.5">
                        Real-time table occupancy & POS bridge operational.
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono mt-1 block">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User role pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-stone-800">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-stone-200 leading-tight">{user.name}</div>
              <div className="text-[10px] font-mono text-stone-400 leading-tight">{user.role}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      {showSearchModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className="bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 max-w-lg w-full overflow-hidden text-stone-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-stone-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-stone-400" />
              <input
                autoFocus
                placeholder="Search orders, dishes, tables, or modules..."
                className="w-full text-sm outline-none bg-transparent text-stone-100 placeholder:text-stone-500"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-xs text-stone-400 border border-stone-800 px-1.5 py-0.5 rounded font-mono"
              >
                ESC
              </button>
            </div>
            <div className="p-3 text-xs text-stone-400 space-y-1">
              <div className="px-2 py-1 font-semibold text-[11px] uppercase tracking-wider text-stone-500">
                Quick Navigation
              </div>
              <Link
                href="/dashboard/orders"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-850 text-stone-200 transition"
              >
                <span>Live Orders Kanban</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </Link>
              <Link
                href="/dashboard/pos"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-850 text-stone-200 transition"
              >
                <span>POS & Cashier Terminal</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </Link>
              <Link
                href="/kitchen"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-850 text-stone-200 transition"
              >
                <span>Kitchen Display System (KDS)</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </Link>
              <Link
                href="/dashboard/ai"
                onClick={() => setShowSearchModal(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-stone-850 text-stone-200 transition"
              >
                <span>AI Business Assistant</span>
                <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
