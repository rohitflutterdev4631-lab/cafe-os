'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Store,
  UserPlus,
  CreditCard,
  Users,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { AppSidebar, NavItem } from '@/components/layout/AppSidebar';
import { AppTopNav } from '@/components/layout/AppTopNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/v1/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN_STAFF')) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems: NavItem[] = [
    { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard, section: 'MANAGEMENT' },
    { label: 'All Cafes', href: '/admin/cafes', icon: Store, section: 'MANAGEMENT' },
    { label: 'Assisted Onboarding', href: '/admin/onboarding', icon: UserPlus, section: 'ONBOARDING' },
    { label: 'AI Menu Importer', href: '/admin/importer', icon: Sparkles, section: 'AI ENGINE' },
    { label: 'Importer Settings', href: '/admin/importer/settings', icon: Sliders, section: 'AI ENGINE' },
    { label: 'Subscription Plans', href: '/admin/plans', icon: CreditCard, section: 'COMMERCE' },
    { label: 'Users & Staff', href: '/admin/users', icon: Users, section: 'SECURITY' },
  ];

  const quickLinks = [
    { label: 'Live Customer Menu', href: '/c/nordic-roast', icon: ExternalLink, external: true },
    { label: 'Cafe Owner View', href: '/dashboard', icon: ChevronRight },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AppSidebar
        brandTitle="CAFE OS"
        brandSubtitle="Super Admin Platform"
        brandColor="bg-purple-600"
        brandTextColor="text-purple-600"
        navItems={navItems}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        quickLinks={quickLinks}
      />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppTopNav
          user={user}
          onToggleSidebar={() => setMobileMenuOpen(true)}
          accentColor="purple"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
