'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Coffee,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  LucideIcon,
  Sparkles,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  section?: string;
}

interface AppSidebarProps {
  brandTitle: string;
  brandSubtitle: string;
  brandColor?: string;
  brandTextColor?: string;
  navItems: NavItem[];
  user: {
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  quickLinks?: { label: string; href: string; icon?: LucideIcon; external?: boolean }[];
}

export function AppSidebar({
  brandTitle,
  brandSubtitle,
  brandColor = 'bg-amber-600',
  brandTextColor = 'text-amber-500',
  navItems,
  user,
  onLogout,
  mobileOpen,
  onMobileClose,
  quickLinks = [],
}: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Group items by section
  const sections: { title?: string; items: NavItem[] }[] = [];
  let currentSection: { title?: string; items: NavItem[] } = { items: [] };

  navItems.forEach((item) => {
    if (item.section && item.section !== currentSection.title) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: item.section, items: [item] };
    } else {
      currentSection.items.push(item);
    }
  });
  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-[#0C0A09] text-stone-100 select-none border-r border-stone-850">
      {/* Top Header */}
      <div>
        <div className="p-4 border-b border-stone-850 flex items-center justify-between">
          <Link
            href={navItems[0]?.href || '/dashboard'}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-600/30 group-hover:scale-105 transition">
              <Coffee className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="font-extrabold text-base text-stone-100 tracking-tight truncate flex items-center gap-1.5">
                  {brandTitle}
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    3D
                  </span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-500 truncate">
                  {brandSubtitle}
                </div>
              </div>
            )}
          </Link>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-xl transition"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-190px)] scrollbar-thin">
          {sections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {sec.title && !collapsed && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  {sec.title}
                </div>
              )}
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shadow-md shadow-amber-950/40'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-amber-400' : 'text-stone-500'
                      }`}
                    />
                    {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                    {!collapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isActive
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                            : 'bg-stone-850 text-stone-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Area: Quick Links + User Profile */}
      <div className="border-t border-stone-850">
        {quickLinks.length > 0 && !collapsed && (
          <div className="p-2 border-b border-stone-900 space-y-1">
            {quickLinks.map((link, idx) => {
              const LinkIcon = link.icon;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-stone-400 hover:text-amber-300 hover:bg-stone-900/50 rounded-xl transition"
                >
                  <span className="truncate">{link.label}</span>
                  {LinkIcon && <LinkIcon className="w-3.5 h-3.5 shrink-0 text-stone-500" />}
                </Link>
              );
            })}
          </div>
        )}

        {/* User Card */}
        <div className="p-3 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 pr-2">
                <div className="text-xs font-bold text-stone-200 truncate">{user.name}</div>
                <div className="text-[10px] text-stone-500 truncate font-mono">{user.role}</div>
              </div>
            )}
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-[#0C0A09] transition-all duration-200 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-out Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0C0A09] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
