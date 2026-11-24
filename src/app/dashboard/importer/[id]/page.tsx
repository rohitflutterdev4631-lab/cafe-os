'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  Smartphone,
  Layers,
  Search,
  Check,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  FileCheck,
  RotateCw,
  FolderPlus,
  HelpCircle,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface ImportItem {
  id: string;
  name: string;
  description?: string | null;
  extractedPrice: number;
  currency: string;
  confidence: number;
  sourcePage: number;
  sourceFile?: string | null;
  reviewStatus: string;
  reviewRequired: boolean;
  manuallyEdited: boolean;
  isVeg: boolean | null;
  foodType?: string | null;
  isAvailable: boolean;
  preparationMinutes?: number | null;
  isBestseller?: boolean;
  matchedItemId?: string | null;
  duplicateAction?: string | null;
  variants: Array<{ id: string; name: string; price: number; isDefault: boolean }>;
  addons: Array<{ id: string; name: string; price: number; groupName: string }>;
}

interface ImportCategory {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  reviewStatus: string;
  items: ImportItem[];
}

export default function ReviewMenuImportPage() {
  const params = useParams();
  const router = useRouter();
  const importId = params.id as string;
  const { showToast } = useToast();

  const [sessionData, setSessionData] = useState<any>(null);
  const [categories, setCategories] = useState<ImportCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Split-view document viewer toggle
  const [showDocViewer, setShowDocViewer] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string>('');

  // Modals
  const [editingItem, setEditingItem] = useState<ImportItem | null>(null);
  const [isNewItemModal, setIsNewItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ImportCategory | null>(null);
  const [isNewCategoryModal, setIsNewCategoryModal] = useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [duplicatesResult, setDuplicatesResult] = useState<any>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    extractedPrice: 0,
    isVeg: null as boolean | null,
    isBestseller: false,
    variants: [] as Array<{ name: string; price: number; isDefault: boolean }>,
    addons: [] as Array<{ name: string; price: number; groupName: string }>,
  });

  // Category form state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Fetch full preview
  const fetchMenuData = async () => {
    try {
      const res = await fetch(`/api/v1/menu-imports/${importId}/preview`);
      const data = await res.json();
      if (data.success && data.data) {
        setSessionData(data.data);
        setCategories(data.data.categories || []);

        if (data.data.status === 'PROCESSING') {
          setIsProcessing(true);
          setProgress(data.data.processingProgress || 10);
        } else {
          setIsProcessing(false);
        }

        // Set initial active category
        if (data.data.categories?.length > 0 && !activeCategoryId) {
          setActiveCategoryId(data.data.categories[0].id);
        }

        // Set initial file for viewer
        if (data.data.files?.length > 0 && !selectedFileId) {
          setSelectedFileId(data.data.files[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll status while processing
  useEffect(() => {
    fetchMenuData();

    const interval = setInterval(async () => {
      if (!isProcessing) return;
      try {
        const res = await fetch(`/api/v1/menu-imports/${importId}/status`);
        const data = await res.json();
        if (data.success && data.data) {
          setProgress(data.data.processingProgress);
          if (data.data.status === 'COMPLETED' || data.data.status === 'FAILED') {
            setIsProcessing(false);
            fetchMenuData();
          }
        }
      } catch (err) {
        console.error('Status poll error:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [importId, isProcessing]);

  // Handle Edit Item
  const openEditItemModal = (item: ImportItem) => {
    setEditingItem(item);
    setIsNewItemModal(false);
    setItemForm({
      name: item.name,
      description: item.description || '',
      extractedPrice: item.extractedPrice,
      isVeg: item.isVeg,
      isBestseller: !!item.isBestseller,
      variants: item.variants.map((v) => ({ name: v.name, price: v.price, isDefault: v.isDefault })),
      addons: item.addons.map((a) => ({ name: a.name, price: a.price, groupName: a.groupName })),
    });
  };

  const openAddItemModal = () => {
    setEditingItem(null);
    setIsNewItemModal(true);
    setItemForm({
      name: '',
      description: '',
      extractedPrice: 0,
      isVeg: null,
      isBestseller: false,
      variants: [],
      addons: [],
    });
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      if (isNewItemModal) {
        // Create new item
        const res = await fetch(`/api/v1/menu-imports/${importId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importCategoryId: activeCategoryId,
            name: itemForm.name,
            description: itemForm.description,
            extractedPrice: itemForm.extractedPrice,
            isVeg: itemForm.isVeg,
            isBestseller: itemForm.isBestseller,
            variants: itemForm.variants,
            addons: itemForm.addons,
          }),
        });
        if (res.ok) {
          showToast('Product added successfully', 'success');
          fetchMenuData();
          setIsNewItemModal(false);
        }
      } else if (editingItem) {
        // Update item
        const res = await fetch(`/api/v1/menu-imports/${importId}/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: itemForm.name,
            description: itemForm.description,
            extractedPrice: itemForm.extractedPrice,
            isVeg: itemForm.isVeg,
            isBestseller: itemForm.isBestseller,
            reviewRequired: false,
            reviewStatus: 'APPROVED',
            variants: itemForm.variants,
            addons: itemForm.addons,
          }),
        });
        if (res.ok) {
          showToast('Product updated successfully', 'success');
          fetchMenuData();
          setEditingItem(null);
        }
      }
    } catch (err) {
      showToast('Failed to save item', 'error');
    }
  };

  const handleDeleteItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/v1/menu-imports/${importId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Product deleted', 'success');
        fetchMenuData();
      }
    } catch (err) {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleDuplicateItem = async (item: ImportItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/v1/menu-imports/${importId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importCategoryId: activeCategoryId,
          name: `${item.name} (Copy)`,
          description: item.description,
          extractedPrice: item.extractedPrice,
          isVeg: item.isVeg,
          variants: item.variants,
          addons: item.addons,
        }),
      });
      if (res.ok) {
        showToast('Product duplicated', 'success');
        fetchMenuData();
      }
    } catch (err) {
      showToast('Failed to duplicate product', 'error');
    }
  };

  // Category Actions
  const handleSaveCategory = async () => {
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }
    try {
      if (isNewCategoryModal) {
        const res = await fetch(`/api/v1/menu-imports/${importId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, description: catDesc }),
        });
        if (res.ok) {
          showToast('Category created', 'success');
          setIsNewCategoryModal(false);
          setCatName('');
          setCatDesc('');
          fetchMenuData();
        }
      } else if (editingCategory) {
        const res = await fetch(`/api/v1/menu-imports/${importId}/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName, description: catDesc }),
        });
        if (res.ok) {
          showToast('Category updated', 'success');
          setEditingCategory(null);
          fetchMenuData();
        }
      }
    } catch (err) {
      showToast('Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`Delete category "${catName}" and all its products?`)) return;
    try {
      const res = await fetch(`/api/v1/menu-imports/${importId}/categories/${catId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Category deleted', 'success');
        fetchMenuData();
      }
    } catch (err) {
      showToast('Failed to delete category', 'error');
    }
  };

  // Run Duplicate Detection
  const handleCheckDuplicates = async () => {
    try {
      setCheckingDuplicates(true);
      const res = await fetch(`/api/v1/menu-imports/${importId}/duplicates`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDuplicatesResult(data.data);
        setShowDuplicatesModal(true);
        fetchMenuData();
      }
    } catch (err) {
      showToast('Failed to run duplicate detection', 'error');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  // Publish Menu
  const handlePublishMenu = async () => {
    try {
      setPublishing(true);
      const res = await fetch(`/api/v1/menu-imports/${importId}/publish`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Menu successfully published to your live digital menu!', 'success');
        setShowPublishConfirm(false);
        fetchMenuData();
      } else {
        showToast(data.error || 'Failed to publish menu', 'error');
      }
    } catch (err) {
      showToast('Network error during publishing', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];
  const totalItemsCount = categories.reduce((acc, c) => acc + c.items.length, 0);
  const unreviewedCount = categories.reduce(
    (acc, c) => acc + c.items.filter((i) => i.reviewRequired || i.extractedPrice === 0).length,
    0
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/importer">
            <Button variant="ghost" size="sm" className="p-2 text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {sessionData?.menuName || 'Review Extracted Menu'}
              </h1>
              {sessionData?.status === 'PUBLISHED' ? (
                <Badge variant="success">Published to Live Menu</Badge>
              ) : sessionData?.status === 'COMPLETED' ? (
                <Badge variant="primary">Review in Progress</Badge>
              ) : sessionData?.status === 'PROCESSING' ? (
                <Badge variant="warning">AI Extracting ({progress}%)</Badge>
              ) : (
                <Badge variant="danger">Extraction Failed</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalItemsCount} products extracted across {categories.length} categories · {sessionData?.currency || 'INR'}
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDocViewer(!showDocViewer)}
            className={`gap-1.5 text-xs ${showDocViewer ? 'bg-slate-100 text-slate-900' : ''}`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showDocViewer ? 'Hide Source File' : 'View Source File'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            loading={checkingDuplicates}
            onClick={handleCheckDuplicates}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Layers className="w-3.5 h-3.5" />
            Check Duplicates
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobilePreview(true)}
            className="gap-1.5 text-xs text-slate-700"
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobile Preview
          </Button>

          {sessionData?.status !== 'PUBLISHED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowPublishConfirm(true)}
              disabled={isProcessing || categories.length === 0}
              className="gap-1.5 text-xs shadow-sm bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Publish to Live Menu
            </Button>
          )}
        </div>
      </div>

      {/* Review Warning Banner if low confidence or missing price */}
      {unreviewedCount > 0 && sessionData?.status !== 'PUBLISHED' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{unreviewedCount} products</strong> require review (missing prices or low confidence score).
            </span>
          </div>
          <span className="text-amber-700 font-medium">Verify against original document</span>
        </div>
      )}

      {/* Processing State Banner */}
      {isProcessing && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">AI Document Extraction in Progress</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Extracting dishes, variants, prices, and categories from your uploaded files. This page will update automatically.
            </p>
          </div>
          <div className="max-w-md mx-auto w-full space-y-1">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Extracting text & OCR...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Workspace (Split Grid) */}
      {!isProcessing && (
        <div className={`grid grid-cols-1 ${showDocViewer ? 'lg:grid-cols-12' : 'lg:grid-cols-4'} gap-6`}>
          {/* Split Pane: Original Document Viewer */}
          {showDocViewer && (
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 flex flex-col h-[750px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Source Document
                  </h3>
                </div>
                {sessionData?.files?.length > 1 && (
                  <select
                    value={selectedFileId}
                    onChange={(e) => setSelectedFileId(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
                  >
                    {sessionData.files.map((f: any) => (
                      <option key={f.id} value={f.id}>
                        {f.originalFilename}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Embedded Document Frame */}
              <div className="flex-1 mt-3 bg-slate-50 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center p-2 relative">
                {selectedFileId ? (
                  <iframe
                    src={`/api/v1/menu-imports/${importId}/files/${selectedFileId}`}
                    className="w-full h-full rounded-lg bg-white"
                    title="Source Document"
                  />
                ) : (
                  <p className="text-xs text-slate-400">No document selected</p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Side-by-side price verification</span>
                {selectedFileId && (
                  <a
                    href={`/api/v1/menu-imports/${importId}/files/${selectedFileId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    Open in new tab <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Center Pane: Category Sidebar */}
          <div className={`${showDocViewer ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-4`}>
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Categories ({categories.length})
                </h3>
                <button
                  onClick={() => {
                    setIsNewCategoryModal(true);
                    setCatName('');
                    setCatDesc('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-blue-600 text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>

              <div className="space-y-1">
                {categories.map((cat) => {
                  const isActive = cat.id === activeCategoryId;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setActiveCategoryId(cat.id)}
                      className={`group p-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                            isActive ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cat.items.length}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatDesc(cat.description || '');
                            setIsNewCategoryModal(false);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Pane: Products in Active Category */}
          <div className={`${showDocViewer ? 'lg:col-span-5' : 'lg:col-span-3'} space-y-4`}>
            {activeCategory ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{activeCategory.name}</h2>
                    {activeCategory.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{activeCategory.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openAddItemModal}
                      className="gap-1.5 text-xs shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Product
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCategory(activeCategory.id, activeCategory.name)}
                      className="text-slate-400 hover:text-rose-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Items List */}
                {activeCategory.items.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No products in this category. Click &ldquo;Add Product&rdquo; above.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 space-y-2">
                    {activeCategory.items.map((item) => (
                      <div
                        key={item.id}
                        className={`pt-3 pb-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3 rounded-xl p-3 hover:bg-slate-50/80 transition-colors ${
                          item.reviewRequired || item.extractedPrice === 0
                            ? 'bg-amber-50/50 border border-amber-200/60'
                            : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Veg/Non-Veg Tag */}
                            {item.isVeg === true && (
                              <span className="w-3.5 h-3.5 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              </span>
                            )}
                            {item.isVeg === false && (
                              <span className="w-3.5 h-3.5 rounded-sm border border-rose-600 flex items-center justify-center p-0.5 shrink-0">
                                <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                              </span>
                            )}

                            <h4 className="text-sm font-semibold text-slate-900 truncate">
                              {item.name}
                            </h4>

                            {/* Confidence / Review Badges */}
                            {item.reviewRequired || item.extractedPrice === 0 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Needs Review
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {Math.round(item.confidence * 100)}% confidence
                              </span>
                            )}

                            {item.isBestseller && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-medium">
                                ★ Bestseller
                              </span>
                            )}
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {/* Variants & Addons Chips */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {item.variants.length > 0 && (
                              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                Variants: {item.variants.map((v) => `${v.name} (₹${v.price})`).join(', ')}
                              </span>
                            )}
                            {item.addons.length > 0 && (
                              <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                Add-ons: {item.addons.map((a) => `${a.name} (+₹${a.price})`).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {sessionData?.currency === 'INR' ? '₹' : sessionData?.currency}{' '}
                            {item.extractedPrice}
                          </span>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditItemModal(item)}
                              className="p-1.5 text-slate-600 hover:text-blue-600"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleDuplicateItem(item, e)}
                              className="p-1.5 text-slate-600 hover:text-slate-900"
                              title="Duplicate Product"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteItem(item.id, e)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                Select or create a category to view dishes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit / Add Product Modal */}
      {(editingItem || isNewItemModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingItem(null);
            setIsNewItemModal(false);
          }}
          title={isNewItemModal ? 'Add New Product' : `Edit "${editingItem?.name}"`}
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setIsNewItemModal(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveItem}>
                Save Product
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <Input
              label="Product Name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Product description, ingredients or tasting notes"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Base Price"
                type="number"
                value={itemForm.extractedPrice}
                onChange={(e) =>
                  setItemForm({ ...itemForm, extractedPrice: parseFloat(e.target.value) || 0 })
                }
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dietary Tag</label>
                <select
                  value={itemForm.isVeg === true ? 'VEG' : itemForm.isVeg === false ? 'NON_VEG' : 'NONE'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemForm({
                      ...itemForm,
                      isVeg: val === 'VEG' ? true : val === 'NON_VEG' ? false : null,
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="NONE">Not Specified</option>
                  <option value="VEG">Vegetarian (Pure Veg)</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={itemForm.isBestseller}
                onChange={(e) => setItemForm({ ...itemForm, isBestseller: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              Mark as Cafe Bestseller (Featured dish)
            </label>
          </div>
        </Modal>
      )}

      {/* Category Modal */}
      {(editingCategory || isNewCategoryModal) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setEditingCategory(null);
            setIsNewCategoryModal(false);
          }}
          title={isNewCategoryModal ? 'Add New Category' : `Edit Category`}
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2.5 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  setIsNewCategoryModal(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveCategory}>
                Save Category
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <Input
              label="Category Name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
            />
            <Input
              label="Description (Optional)"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {/* Duplicate Detection Dialog */}
      {showDuplicatesModal && duplicatesResult && (
        <Modal
          isOpen={showDuplicatesModal}
          onClose={() => setShowDuplicatesModal(false)}
          title="Duplicate Detection Summary"
          maxWidth="max-w-2xl"
          footer={
            <Button variant="primary" size="sm" onClick={() => setShowDuplicatesModal(false)}>
              Done Reviewing Duplicates
            </Button>
          }
        >
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500">Total Items</p>
                <p className="text-lg font-bold text-slate-900">{duplicatesResult.totalExtractedItems}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <p className="text-xs text-emerald-600">Brand New Items</p>
                <p className="text-lg font-bold text-emerald-700">{duplicatesResult.newItemsCount}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <p className="text-xs text-amber-600">Potential Duplicates</p>
                <p className="text-lg font-bold text-amber-700">{duplicatesResult.duplicateItemsCount}</p>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {duplicatesResult.matches.map((m: any, idx: number) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900">{m.importItemName}</span>
                    <span className="text-slate-500 ml-2">(₹{m.importItemPrice})</span>
                    {m.matchedExistingItem ? (
                      <p className="text-slate-500 mt-0.5">
                        Matches existing item:{' '}
                        <strong className="text-slate-700">{m.matchedExistingItem.name}</strong> (₹{m.matchedExistingItem.basePrice})
                      </p>
                    ) : (
                      <p className="text-emerald-600 mt-0.5">New unique product</p>
                    )}
                  </div>

                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-medium shrink-0">
                    {m.suggestedAction}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile Customer Menu Preview Modal */}
      {showMobilePreview && (
        <Modal
          isOpen={showMobilePreview}
          onClose={() => setShowMobilePreview(false)}
          title="Mobile Digital Menu Preview"
          maxWidth="max-w-md"
        >
          <div className="py-2">
            <p className="text-xs text-slate-500 mb-3 text-center">
              Simulated mobile view of your imported menu for dining customers:
            </p>

            {/* Simulated iPhone Frame */}
            <div className="border-[6px] border-slate-900 rounded-[32px] overflow-hidden bg-slate-50 shadow-xl max-h-[550px] overflow-y-auto">
              <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="w-16 h-1 bg-slate-300 rounded-full mx-auto mb-2"></div>
                <h4 className="text-sm font-bold text-slate-900 text-center">
                  {sessionData?.menuName || 'Nord Cafe Menu'}
                </h4>
              </div>

              <div className="p-3 space-y-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 px-1">
                      {cat.name}
                    </h5>
                    <div className="space-y-2">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-bold text-blue-600 font-mono shrink-0">
                            ₹{item.extractedPrice}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Publish Confirmation Modal */}
      {showPublishConfirm && (
        <ConfirmDialog
          isOpen={showPublishConfirm}
          onClose={() => setShowPublishConfirm(false)}
          onConfirm={handlePublishMenu}
          title="Publish Menu to Live Cafe?"
          description={`You are about to publish ${totalItemsCount} products across ${categories.length} categories to your live digital cafe menu. This action will immediately make these items available for dining customer orders.`}
          confirmText="Yes, Publish Menu"
          variant="primary"
          loading={publishing}
        />
      )}
    </div>
  );
}
