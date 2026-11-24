'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  ChefHat,
  Store,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function DashboardStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('Rahul Verma');
  const [email, setEmail] = useState('rahul.kitchen@nordicroast.com');
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('Staff123!');
  const [roleName, setRoleName] = useState('KITCHEN_STAFF');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/v1/staff');
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
      }
    } catch {
      toastError('Error', 'Could not load staff list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/v1/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, roleName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add staff member');

      success('Staff Member Added', `${name} invited as ${roleName}.`);
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
      toastError('Invite Failed', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Staff Member',
      accessorKey: 'user',
      sortable: true,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
            {s.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-stone-100">{s.user?.name}</div>
            <div className="text-xs text-stone-400 font-mono">{s.user?.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Role Assignment',
      cell: (s) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
          {s.role?.name === 'KITCHEN_STAFF' ? (
            <ChefHat className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Store className="w-3.5 h-3.5 text-amber-400" />
          )}
          {s.role?.name}
        </span>
      ),
    },
    {
      header: 'Assigned Branch',
      cell: (s) => (
        <span className="text-xs text-stone-300 font-medium">
          {s.branch?.name || 'All Branches'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (s) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {s.user?.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      header: 'Joined Date',
      className: 'text-right',
      cell: (s) => (
        <span className="text-xs text-stone-400 font-mono">{formatDate(s.user?.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-stone-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS Team & Access Control
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Staff & Roles</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Manage your kitchen chefs, baristas, branch managers, and team member permissions.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Invite Staff Member
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : (
        <div className="bg-stone-900/80 rounded-2xl border border-stone-800 p-4 shadow-xl">
          <DataTable
            data={staff}
            columns={columns}
            searchPlaceholder="Search staff by name or email..."
            searchKey={(s) => `${s.user?.name || ''} ${s.user?.email || ''} ${s.role?.name || ''}`}
            pageSize={10}
            exportFileName="cafe-staff-roster"
            emptyState={{
              title: 'No staff members found',
              description: 'Click "Invite Staff Member" to add kitchen staff or branch managers.',
            }}
          />
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Invite Staff Member"
          subtitle="Provisions login access to assigned cafe dashboards."
          maxWidth="max-w-md"
        >
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleAddStaff} className="space-y-4 text-xs text-stone-200">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Staff Member Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jaspreet Kaur"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Work Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@cafe.com"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Role *</label>
              <select
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100"
              >
                <option value="KITCHEN_STAFF">Kitchen Staff (KDS Preparation Tablet)</option>
                <option value="CAFE_MANAGER">Cafe Manager (Orders & Dining Tables)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Initial Password *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 font-mono border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-amber-950/40"
              >
                {submitting ? 'Saving...' : 'Add Team Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
