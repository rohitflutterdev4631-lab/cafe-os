'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  BookOpen,
  QrCode,
  TableProperties,
  BarChart3,
  CreditCard,
  Settings,
  ChefHat,
  Users,
  ExternalLink,
  Sparkles,
  Package,
  Calendar,
  DollarSign,
  Shield,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar';
import { AppTopNav } from '@/components/layout/AppTopNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [cafe, setCafe] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setUser(data.user);
          if (data.user.role === 'KITCHEN_STAFF') {
            router.push('/kitchen');
          }
        }
      })
      .catch(() => router.push('/login'));

    fetch('/api/v1/cafes/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCafe(data.cafe);
        }
      });

    // Check active orders count for badge
    fetch('/api/v1/orders?status=ACTIVE')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          const activeCount = data.orders.filter(
            (o: any) => o.status === 'PENDING' || o.status === 'PREPARING'
          ).length;
          setActiveOrdersCount(activeCount);
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems: NavItem[] = [
    { label: '3D Cafe HQ', href: '/dashboard', icon: LayoutDashboard, section: 'SPATIAL OPERATIONS' },
    { label: 'POS Terminal', href: '/dashboard/pos', icon: Receipt, badge: 'POS', section: 'SPATIAL OPERATIONS' },
    {
      label: 'Live Orders',
      href: '/dashboard/orders',
      icon: Receipt,
      badge: activeOrdersCount && activeOrdersCount > 0 ? activeOrdersCount : undefined,
      section: 'SPATIAL OPERATIONS',
    },
    { label: 'Kitchen KDS', href: '/kitchen', icon: ChefHat, section: 'SPATIAL OPERATIONS' },
    { label: 'Dining Tables', href: '/dashboard/tables', icon: TableProperties, section: 'RESTAURANT SETUP' },
    { label: 'Inventory & Recipes', href: '/dashboard/inventory', icon: Package, section: 'RESTAURANT SETUP' },
    { label: 'Menu Catalog', href: '/dashboard/menu', icon: BookOpen, section: 'RESTAURANT SETUP' },
    { label: 'QR Code Studio', href: '/dashboard/qr-codes', icon: QrCode, section: 'RESTAURANT SETUP' },
    { label: 'Reservations & Waitlist', href: '/dashboard/reservations', icon: Calendar, section: 'CUSTOMERS & SALES' },
    { label: 'AI Business Assistant', href: '/dashboard/ai', icon: Bot, badge: 'AI', section: 'CUSTOMERS & SALES' },
    { label: 'Expenses & COGS', href: '/dashboard/expenses', icon: DollarSign, section: 'CUSTOMERS & SALES' },
    { label: 'Cash Shift Register', href: '/dashboard/shifts', icon: Shield, section: 'CUSTOMERS & SALES' },
    { label: 'Sales Analytics', href: '/dashboard/analytics', icon: BarChart3, section: 'GROWTH & BILLING' },
    { label: 'Subscription Plan', href: '/dashboard/subscription', icon: CreditCard, section: 'GROWTH & BILLING' },
    { label: 'Team & Staff', href: '/dashboard/staff', icon: Users, section: 'GROWTH & BILLING' },
    { label: 'Cafe Settings', href: '/dashboard/settings', icon: Settings, section: 'CONFIGURATION' },
  ];

  const cafeSlug = cafe?.slug || 'nordic-roast';

  const quickLinks = [
    { label: 'Live Customer Storefront', href: `/c/${cafeSlug}`, icon: ExternalLink, external: true },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0C0A09] flex flex-col items-center justify-center space-y-4 text-stone-300">
        <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-xs font-mono tracking-widest uppercase text-stone-400">
          Initializing CAFE OS Headquarters...
        </div>
      </div>
    );
  }

  const isOverviewPage = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 flex overflow-hidden">
      {/* Sidebar */}
      <AppSidebar
        brandTitle="CAFE OS"
        brandSubtitle={cafe?.name ? `${cafe.name}` : '3D Hospitality OS'}
        brandColor="bg-amber-600"
        brandTextColor="text-amber-500"
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        quickLinks={quickLinks}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppTopNav
          user={user}
          cafe={cafe}
          onToggleSidebar={() => setMobileMenuOpen(true)}
        />

        {isOverviewPage ? (
          <main className="flex-1 overflow-hidden relative">
            {children}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        )}
      </div>
    </div>
  );
}
