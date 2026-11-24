'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  UserPlus,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Settings,
  Mail,
  Phone,
  Calendar,
  Layers,
  UtensilsCrossed,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DataTable, Column, TableFilter } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function AdminCafesPage() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCafe, setSelectedCafe] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { success, error } = useToast();

  const fetchCafes = async () => {
    try {
      const res = await fetch('/api/v1/admin/cafes');
      const data = await res.json();
      if (data.success) {
        setCafes(data.cafes);
      }
    } catch {
      error('Failed to load cafes', 'Could not fetch tenant directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCafes();
  }, []);

  const handleStatusChange = async (cafeId: string, newStatus: string, cafeName: string) => {
    setUpdatingId(cafeId);
    try {
      const res = await fetch(`/api/v1/admin/cafes/${cafeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        success('Status Updated', `${cafeName} is now ${newStatus}.`);
        setCafes((prev) =>
          prev.map((c) => (c.id === cafeId ? { ...c, status: newStatus } : c))
        );
        if (selectedCafe && selectedCafe.id === cafeId) {
          setSelectedCafe({ ...selectedCafe, status: newStatus });
        }
      } else {
        error('Update Failed', 'Failed to change cafe status.');
      }
    } catch {
      error('Network Error', 'Check your connection.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkStatusChange = async (items: any[], newStatus: string) => {
    try {
      await Promise.all(
        items.map((item) =>
          fetch(`/api/v1/admin/cafes/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      success('Bulk Action Complete', `${items.length} cafes set to ${newStatus}.`);
      fetchCafes();
    } catch {
      error('Bulk Action Failed', 'Could not update all selected cafes.');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Cafe & Identifier',
      accessorKey: 'name',
      sortable: true,
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
            {c.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 hover:text-purple-600 transition">
              {c.name}
            </div>
            <div className="text-xs font-mono text-purple-600">/c/{c.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Owner Contact',
      accessorKey: 'owner',
      cell: (c) => (
        <div>
          <div className="text-slate-900 font-medium">{c.owner?.name || 'Unassigned'}</div>
          <div className="text-xs text-slate-500">{c.owner?.email}</div>
          {c.owner?.phone && (
            <div className="text-xs text-slate-400 font-mono mt-0.5">{c.owner.phone}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Plan Tier',
      cell: (c) => {
        const sub = c.subscriptions?.[0]?.plan?.name || 'Free';
        return (
          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            {sub} Plan
          </span>
        );
      },
    },
    {
      header: 'Catalog & Tables',
      cell: (c) => (
        <div className="text-xs">
          <div className="text-slate-700 font-semibold">
            {c._count.menuItems} items • {c._count.categories} categories
          </div>
          <div className="text-slate-400 mt-0.5">
            {c._count.diningTables} tables • {c._count.orders} orders
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (c) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            c.status === 'ACTIVE'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : c.status === 'PENDING_APPROVAL'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              c.status === 'ACTIVE'
                ? 'bg-emerald-500'
                : c.status === 'PENDING_APPROVAL'
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
          />
          {c.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => setSelectedCafe(c)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            href={`/c/${c.slug}`}
            target="_blank"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Preview Public Menu"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={() =>
              handleStatusChange(
                c.id,
                c.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                c.name
              )
            }
            disabled={updatingId === c.id}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              c.status === 'ACTIVE'
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilter<any>[] = [
    {
      id: 'status',
      label: 'Status',
      key: 'status',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Pending Approval', value: 'PENDING_APPROVAL' },
        { label: 'Suspended', value: 'SUSPENDED' },
      ],
    },
  ];

  const bulkActions = [
    {
      label: 'Bulk Activate',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      variant: 'primary' as const,
      onClick: (items: any[]) => handleBulkStatusChange(items, 'ACTIVE'),
    },
    {
      label: 'Bulk Suspend',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      variant: 'danger' as const,
      onClick: (items: any[]) => handleBulkStatusChange(items, 'SUSPENDED'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tenant Cafe Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage all tenant cafes, subscriptions, status, and public menu routing.
          </p>
        </div>
        <Link
          href="/admin/onboarding"
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-purple-700 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Assisted Onboarding Wizard
        </Link>
      </div>

      {/* Main Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : (
        <DataTable
          data={cafes}
          columns={columns}
          searchPlaceholder="Search cafes by name, slug, owner email..."
          searchKey={(c) => `${c.name} ${c.slug} ${c.owner?.name || ''} ${c.owner?.email || ''}`}
          filters={filters}
          pageSize={10}
          exportFileName="nord-cafes-directory"
          bulkActions={bulkActions}
          emptyState={{
            title: 'No cafes found',
            description: 'No tenant cafes matched your current filter criteria.',
            actionLabel: 'Onboard New Cafe',
            onAction: () => (window.location.href = '/admin/onboarding'),
          }}
        />
      )}

      {/* Cafe Detail Modal */}
      {selectedCafe && (
        <Modal
          isOpen={!!selectedCafe}
          onClose={() => setSelectedCafe(null)}
          title={selectedCafe.name}
          subtitle={`Slug: /c/${selectedCafe.slug}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Link
                href={`/c/${selectedCafe.slug}`}
                target="_blank"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
              >
                <span>Preview Public Menu</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleStatusChange(
                      selectedCafe.id,
                      selectedCafe.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                      selectedCafe.name
                    )
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    selectedCafe.status === 'ACTIVE'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {selectedCafe.status === 'ACTIVE' ? 'Suspend Cafe' : 'Activate Cafe'}
                </button>
                <button
                  onClick={() => setSelectedCafe(null)}
                  className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-sm">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                <div className="font-bold text-slate-900 mt-0.5">{selectedCafe.status}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Plan</span>
                <div className="font-bold text-purple-700 mt-0.5">
                  {selectedCafe.subscriptions?.[0]?.plan?.name || 'Free'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Menu Items</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedCafe._count?.menuItems || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-400">Orders</span>
                <div className="font-bold text-slate-900 mt-0.5">
                  {selectedCafe._count?.orders || 0}
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Primary Account Holder
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Name:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedCafe.owner?.name || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {selectedCafe.owner?.email || 'N/A'}
                  </span>
                </div>
                {selectedCafe.owner?.phone && (
                  <div>
                    <span className="text-slate-400">Phone:</span>{' '}
                    <span className="font-semibold text-slate-800">
                      {selectedCafe.owner.phone}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Registered:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    {formatDate(selectedCafe.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Cafe Description / Brand */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                About & Description
              </div>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                {selectedCafe.description || 'No description provided by cafe owner.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
