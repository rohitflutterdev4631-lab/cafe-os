'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Plus,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  Trash2,
  Eye,
  FileSpreadsheet,
  FileImage,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

interface ImportRecord {
  id: string;
  menuName: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PUBLISHED' | 'ARCHIVED';
  processingProgress: number;
  totalCategories: number;
  totalItems: number;
  currency: string;
  createdAt: string;
  publishedAt?: string | null;
  errorMessage?: string | null;
  user: {
    name: string;
    email: string;
  };
  files: Array<{
    id: string;
    originalFilename: string;
    fileSize: number;
    mimeType: string;
    processingStatus: string;
  }>;
}

export default function MenuImporterHistoryPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ImportRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

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
      const res = await fetch(`/api/v1/menu-imports/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Menu import session deleted successfully', 'success');
        setImports((prev) => prev.filter((i) => i.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        showToast(data.error || 'Failed to delete import', 'error');
      }
    } catch {
      showToast('Error deleting import session', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRetry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRetryingId(id);
      const res = await fetch(`/api/v1/menu-imports/${id}/retry`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Processing restarted for menu import', 'info');
        fetchImports();
      } else {
        showToast(data.error || 'Failed to restart import', 'error');
      }
    } catch {
      showToast('Error retrying import', 'error');
    } finally {
      setRetryingId(null);
    }
  };

  const filteredImports = imports.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchName = item.menuName.toLowerCase().includes(q);
    const matchUser = item.user.name.toLowerCase().includes(q);
    const matchFile = item.files.some((f) => f.originalFilename.toLowerCase().includes(q));
    return matchName || matchUser || matchFile;
  });

  const stats = {
    total: imports.length,
    completed: imports.filter((i) => ['COMPLETED', 'PUBLISHED'].includes(i.status)).length,
    processing: imports.filter((i) => ['PENDING', 'PROCESSING'].includes(i.status)).length,
    failed: imports.filter((i) => i.status === 'FAILED').length,
    published: imports.filter((i) => i.status === 'PUBLISHED').length,
  };

  const getStatusBadge = (status: ImportRecord['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published to Live Menu</Badge>;
      case 'COMPLETED':
        return <Badge variant="primary">Extraction Ready</Badge>;
      case 'PROCESSING':
      case 'PENDING':
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <RotateCw className="w-3 h-3 animate-spin" />
            AI Parsing...
          </Badge>
        );
      case 'FAILED':
        return <Badge variant="danger">Extraction Failed</Badge>;
      default:
        return <Badge variant="neutral">Draft Pending</Badge>;
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-4 h-4 text-rose-400" />;
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return <FileImage className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-stone-400" />;
  };

  return (
    <div className="space-y-6 text-stone-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">AI Menu Importer</h1>
          </div>
          <p className="mt-1 text-sm text-stone-400">
            Automatically convert existing paper menus, PDFs, Excel sheets, and photos into a digital menu.
          </p>
        </div>

        <Link href="/dashboard/importer/new">
          <Button variant="primary" className="gap-2 shadow-md bg-amber-600 hover:bg-amber-500 text-white">
            <Plus className="w-4 h-4" />
            New Menu Import
          </Button>
        </Link>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Imports</p>
          <p className="mt-1 text-2xl font-bold text-stone-100 font-mono">{stats.total}</p>
          <p className="mt-1 text-xs text-stone-500">All uploaded sessions</p>
        </div>

        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Published Menus</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">{stats.published}</p>
          <p className="mt-1 text-xs text-stone-500">Live in digital catalog</p>
        </div>

        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Ready for Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-400 font-mono">{stats.completed - stats.published}</p>
          <p className="mt-1 text-xs text-stone-500">Awaiting owner approval</p>
        </div>

        <div className="bg-stone-900/90 p-4 rounded-2xl border border-stone-800 shadow-xl">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Processing / Failed</p>
          <p className="mt-1 text-2xl font-bold text-stone-100 font-mono">
            {stats.processing + stats.failed}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {stats.processing} active, {stats.failed} failed
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Filter Tabs */}
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
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search by menu or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-950 border border-stone-800 text-stone-100 rounded-xl focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>
      </div>

      {/* Import Sessions List */}
      {loading ? (
        <div className="bg-stone-900 rounded-2xl border border-stone-800 p-12 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-stone-300">Loading import sessions...</p>
        </div>
      ) : filteredImports.length === 0 ? (
        <div className="bg-stone-900/90 rounded-2xl border border-stone-800 p-12 text-center shadow-xl">
          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-stone-100">No menu imports found</h3>
          <p className="mt-1 text-sm text-stone-400 max-w-md mx-auto">
            {searchQuery
              ? 'No imports match your search criteria. Try a different query.'
              : 'Upload your restaurant menu in PDF, Word, Excel, CSV, or photo format to automatically create a structured digital menu.'}
          </p>
          <div className="mt-6">
            <Link href="/dashboard/importer/new">
              <Button variant="primary" className="gap-2 bg-amber-600 hover:bg-amber-500 text-white shadow-md">
                <Plus className="w-4 h-4" />
                Upload Your First Menu
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900/90 rounded-2xl border border-stone-800 shadow-xl overflow-hidden divide-y divide-stone-800">
          {filteredImports.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/dashboard/importer/${item.id}`)}
              className="p-5 hover:bg-stone-850/60 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-base font-semibold text-stone-100 truncate">
                    {item.menuName}
                  </h4>
                  {getStatusBadge(item.status)}
                </div>

                <div className="mt-2 flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                  <span className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    Uploaded by: <strong className="text-stone-300">{item.user.name}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{item.totalCategories}</strong> Categories
                  </span>
                  <span>•</span>
                  <span>
                    <strong>{item.totalItems}</strong> Products
                  </span>
                </div>

                {/* Files List Pills */}
                {item.files.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {item.files.map((file) => (
                      <span
                        key={file.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-800 text-stone-300 border border-stone-700 rounded-lg text-xs font-mono"
                      >
                        {getFileIcon(file.originalFilename)}
                        <span className="truncate max-w-[200px]">{file.originalFilename}</span>
                        <span className="text-stone-500 text-[10px]">
                          ({(file.fileSize / 1024).toFixed(0)} KB)
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress bar if processing */}
                {item.status === 'PROCESSING' && (
                  <div className="mt-3 max-w-md">
                    <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
                      <span className="font-medium text-amber-400">Extracting menu contents...</span>
                      <span className="font-mono">{item.processingProgress}%</span>
                    </div>
                    <div className="w-full bg-stone-950 rounded-full h-2 overflow-hidden border border-stone-800">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.processingProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Error message if failed */}
                {item.status === 'FAILED' && item.errorMessage && (
                  <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {item.errorMessage}
                  </p>
                )}
              </div>

              {/* Right Actions */}
              <div
                className="flex items-center gap-2 shrink-0 self-end md:self-center"
                onClick={(e) => e.stopPropagation()}
              >
                {item.status === 'FAILED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={retryingId === item.id}
                    onClick={(e) => handleRetry(item.id, e)}
                    className="gap-1.5 text-xs text-amber-400 hover:text-amber-300 border-amber-500/30"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry
                  </Button>
                )}

                <Link href={`/dashboard/importer/${item.id}`}>
                  <Button variant={item.status === 'COMPLETED' ? 'primary' : 'outline'} size="sm" className="gap-1 text-xs">
                    {item.status === 'PUBLISHED' ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        View Extraction
                      </>
                    ) : item.status === 'COMPLETED' ? (
                      <>
                        Review & Edit
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </>
                    ) : (
                      <>Inspect Session</>
                    )}
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  className="text-stone-500 hover:text-rose-400 p-2"
                  title="Delete import session"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={`Delete "${deleteTarget.menuName}"?`}
          description="This action cannot be undone. Any parsed menu items in draft status will be permanently removed."
          confirmText="Delete Import Session"
          variant="danger"
          loading={deleting}
        />
      )}
    </div>
  );
}
