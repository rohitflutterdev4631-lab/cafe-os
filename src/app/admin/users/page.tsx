'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Store,
  ChefHat,
  Loader2,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DataTable, Column, TableFilter } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('Priya Sharma');
  const [email, setEmail] = useState('priya@nordcafe.com');
  const [password, setPassword] = useState('NordStaff2026!');
  const [roleName, setRoleName] = useState('ADMIN_STAFF');
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      error('Failed to load users', 'Could not fetch user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, roleName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      success('Staff Member Added', `${name} created with role ${roleName}.`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err: any) {
      error('Creation Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Name & Email',
      accessorKey: 'name',
      sortable: true,
      cell: (u) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-xs shrink-0">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-slate-900">{u.name}</div>
            <div className="text-xs text-slate-500 font-mono">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Platform Role',
      accessorKey: 'role',
      sortable: true,
      cell: (u) => {
        const role = u.userRoles?.[0]?.role?.name || 'CUSTOMER';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            {role === 'SUPER_ADMIN' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            ) : role === 'CAFE_OWNER' ? (
              <Store className="w-3.5 h-3.5 text-blue-600" />
            ) : role === 'KITCHEN_STAFF' ? (
              <ChefHat className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-slate-600" />
            )}
            {role}
          </span>
        );
      },
    },
    {
      header: 'Associated Tenant',
      cell: (u) => {
        const cafeName = u.userRoles?.[0]?.cafe?.name || 'Platform HQ (All Tenants)';
        return (
          <div className="text-xs font-medium text-slate-800">
            {cafeName}
          </div>
        );
      },
    },
    {
      header: 'Account Status',
      accessorKey: 'status',
      sortable: true,
      cell: (u) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {u.status}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      accessorKey: 'createdAt',
      sortable: true,
      className: 'text-right',
      cell: (u) => (
        <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Identity & Access Management (RBAC)
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Users & Staff
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit system administrators, operations staff, and cafe owners across all tenants.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-purple-700 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Add Platform Staff
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <DataTable
          data={users}
          columns={columns}
          searchPlaceholder="Search users by name, email, or role..."
          searchKey={(u) => `${u.name} ${u.email} ${u.userRoles?.[0]?.role?.name || ''}`}
          pageSize={10}
          exportFileName="nord-users-directory"
          emptyState={{
            title: 'No users found',
            description: 'No accounts match the specified criteria.',
          }}
        />
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Platform Admin / Staff"
          subtitle="Provision privileged access to platform operations."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 uppercase">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Joshi"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase">Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@nordcafe.com"
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase">Platform Role *</label>
              <select
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <option value="ADMIN_STAFF">Admin Staff (Support & Onboarding)</option>
                <option value="SUPER_ADMIN">Super Admin (Full Unrestricted Access)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 uppercase">Initial Password *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 font-mono border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? 'Creating...' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
