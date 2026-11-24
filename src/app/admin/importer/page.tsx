'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Store,
  Eye,
  Trash2,
  RotateCw,
  Search,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function SuperAdminImporterDashboard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imports, setImports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchImports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/menu-imports?status=${statusFilter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setImports(data.data);
      }
    } catch (err) {
      console.error('Failed to load imports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/v1/menu-imports/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Import session deleted', 'success');
        setImports((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      showToast('Failed to delete import', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = imports.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.menuName.toLowerCase().includes(q) ||
      item.cafe?.name?.toLowerCase().includes(q) ||
      item.user?.name?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: imports.length,
    published: imports.filter((i) => i.status === 'PUBLISHED').length,
    processing: imports.filter((i) => i.status === 'PROCESSING').length,
    failed: imports.filter((i) => i.status === 'FAILED').length,
    totalDishes: imports.reduce((acc, i) => acc + (i.totalItems || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              AI Menu Importer Governance
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Monitor all AI document ingestion sessions, extraction pipelines, and failure triage across all platform tenants.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/importer/settings">
            <Button variant="outline" size="sm" className="gap-2">
              <Sliders className="w-4 h-4" />
              Engine Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Ingestion Sessions
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-400">All cafes combined</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
            Dishes Digitized
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{stats.totalDishes}</p>
          <p className="mt-1 text-xs text-slate-400">Products extracted</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
            Published to Production
          </p>
          <p className="mt-1 text-2xl font-bold text-purple-700">{stats.published}</p>
          <p className="mt-1 text-xs text-slate-400">Active cafe menus</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
            Processing Failures
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.failed}</p>
          <p className="mt-1 text-xs text-slate-400">Needs manual retry</p>
        </div>
      </div>

      {/* Filter and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { label: 'All Sessions', value: 'ALL' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Published', value: 'PUBLISHED' },
                { label: 'Processing', value: 'PROCESSING' },
                { label: 'Failed', value: 'FAILED' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors ${
                    statusFilter === tab.value
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by cafe, menu or user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">Loading all cafe imports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          No import sessions found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-slate-900">{item.menuName}</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-medium">
                    <Store className="w-3 h-3 text-slate-500" />
                    {item.cafe?.name}
                  </span>
                  {item.status === 'PUBLISHED' && <Badge variant="success">Published</Badge>}
                  {item.status === 'COMPLETED' && <Badge variant="primary">Extracted</Badge>}
                  {item.status === 'PROCESSING' && <Badge variant="warning">Processing</Badge>}
                  {item.status === 'FAILED' && <Badge variant="danger">Failed</Badge>}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                  <span>
                    Uploaded by: <strong className="text-slate-700">{item.user?.name}</strong> ({item.user?.email})
                  </span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{item.totalCategories} Categories, {item.totalItems} Items</span>
                </div>

                {item.errorMessage && (
                  <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {item.errorMessage}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/dashboard/importer/${item.id}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="text-slate-400 hover:text-rose-600 p-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={`Delete "${deleteTarget.menuName}"?`}
          description="Are you sure you want to delete this import session?"
          confirmText="Delete"
          variant="danger"
          loading={deleting}
        />
      )}
    </div>
  );
}
