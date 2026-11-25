'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  BookOpen,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
  Search,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { SkeletonFoodCard } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

export default function DashboardMenuPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { success, error: toastError, info } = useToast();

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  // Form State
  const [itemForm, setItemForm] = useState<any>({
    categoryId: '',
    name: '',
    description: '',
    basePrice: '',
    image: '',
    foodType: 'VEG',
    preparationMinutes: 12,
    isFeatured: false,
    isBestseller: false,
    variants: [{ name: 'Regular', price: '', isDefault: true }],
  });

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/v1/menu');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
        setItems(data.items || []);
        if (data.categories && data.categories.length > 0 && !itemForm.categoryId) {
          setItemForm((prev: any) => ({ ...prev, categoryId: data.categories[0].id }));
        }
      }
    } catch {
      toastError('Fetch Error', 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean, itemName: string) => {
    try {
      const res = await fetch(`/api/v1/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !currentStatus }),
      });
      if (res.ok) {
        success(
          !currentStatus ? 'Marked In Stock' : 'Marked Sold Out',
          `${itemName} is now ${!currentStatus ? 'available' : 'unavailable'} for ordering.`
        );
        fetchMenu();
      }
    } catch {
      toastError('Update Error', 'Could not update item availability.');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/v1/menu/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, description: catDesc }),
      });
      const data = await res.json();
      if (data.success) {
        success('Category Created', `"${catName}" added successfully.`);
        setShowCatModal(false);
        setCatName('');
        setCatDesc('');
        fetchMenu();
      } else {
        toastError('Failed', data.error);
      }
    } catch {
      toastError('Network Error', 'Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: itemForm.categoryId,
          name: itemForm.name,
          description: itemForm.description,
          basePrice: parseFloat(itemForm.basePrice),
          image: itemForm.image || null,
          foodType: itemForm.foodType,
          preparationMinutes: Number(itemForm.preparationMinutes) || 10,
          isFeatured: itemForm.isFeatured,
          isBestseller: itemForm.isBestseller,
          variants: itemForm.variants.filter((v: any) => v.name && v.price),
        }),
      });

      const data = await res.json();
      if (data.success) {
        success('Food Item Created', `"${itemForm.name}" was added to menu.`);
        setShowItemModal(false);
        setItemForm({
          categoryId: categories[0]?.id || '',
          name: '',
          description: '',
          basePrice: '',
          image: '',
          foodType: 'VEG',
          preparationMinutes: 12,
          isFeatured: false,
          isBestseller: false,
          variants: [{ name: 'Regular', price: '', isDefault: true }],
        });
        fetchMenu();
      } else {
        setError(data.error);
      }
    } catch {
      setError('An error occurred while creating item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCsvImport = async () => {
    if (!csvContent.trim()) return;
    setSubmitting(true);
    try {
      const lines = csvContent.trim().split('\n');
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',');
        return {
          category: parts[0]?.trim(),
          name: parts[1]?.trim(),
          description: parts[2]?.trim(),
          price: parseFloat(parts[3]?.trim() || '0'),
          foodType: parts[4]?.trim() || 'VEG',
          prepTime: parseInt(parts[5]?.trim() || '10', 10),
        };
      });

      const res = await fetch('/api/v1/menu/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      });
      const data = await res.json();
      if (data.success) {
        success('Bulk Import Finished', `Imported ${data.count || rows.length} dishes.`);
        setShowCsvModal(false);
        setCsvContent('');
        fetchMenu();
      } else {
        toastError('Import Failed', data.error);
      }
    } catch {
      toastError('Network Error', 'Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = items.filter((it) => {
    if (selectedCatId !== 'ALL' && it.categoryId !== selectedCatId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        (it.description && it.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-stone-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> CAFE OS Artisan Menu Catalog
          </div>
          <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">Menu Catalog & Recipes</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            Manage your categories, food items, variants, prices, and stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-3.5 py-2 bg-stone-900 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-850 hover:text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" /> Bulk CSV Import
          </button>
          <button
            onClick={() => setShowCatModal(true)}
            className="px-3.5 py-2 bg-stone-900 border border-stone-800 text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-850 hover:text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Add Category
          </button>
          <button
            onClick={() => setShowItemModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/40 hover:bg-amber-500 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food by name or recipe..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-900/90 border border-stone-800 text-stone-100 placeholder:text-stone-500 rounded-xl focus:outline-none focus:border-amber-500/50 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 max-w-full text-xs">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              selectedCatId === 'ALL'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                : 'bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
            }`}
          >
            All Items ({items.length})
          </button>

          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCatId(c.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                selectedCatId === c.id
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-950/40'
                  : 'bg-stone-900 border border-stone-800 text-stone-400 hover:bg-stone-850 hover:text-stone-200'
              }`}
            >
              {c.name} ({items.filter((it) => it.categoryId === c.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Food Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonFoodCard />
          <SkeletonFoodCard />
          <SkeletonFoodCard />
          <SkeletonFoodCard />
          <SkeletonFoodCard />
          <SkeletonFoodCard />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-stone-900 p-12 text-center rounded-2xl border border-stone-800 text-stone-400 text-sm">
          No food items found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-stone-900/90 rounded-2xl border border-stone-800 p-5 shadow-lg flex flex-col justify-between hover:border-amber-500/50 transition group"
            >
              <div>
                <div className="flex gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 bg-stone-950 border border-stone-800"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          item.foodType === 'VEG'
                            ? 'bg-emerald-400'
                            : item.foodType === 'NON_VEG'
                            ? 'bg-rose-400'
                            : 'bg-amber-400'
                        }`}
                        title={item.foodType}
                      />
                      <span className="font-bold text-sm text-stone-100 truncate group-hover:text-amber-400 transition">{item.name}</span>
                    </div>

                    <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                      {item.description || 'No description provided.'}
                    </p>

                    <div className="mt-2 text-sm font-extrabold text-amber-400 font-mono">
                      {formatCurrency(item.basePrice)}
                    </div>
                  </div>
                </div>

                {/* Badges & Variants */}
                <div className="mt-3 pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                  <div className="flex items-center gap-2">
                    {item.isBestseller && (
                      <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
                        ★ Bestseller
                      </span>
                    )}
                    {item.variants && item.variants.length > 0 && (
                      <span className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-[10px] font-mono">
                        {item.variants.length} Sizes
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                    <Clock className="w-3 h-3 text-stone-500" /> {item.preparationMinutes} min
                  </span>
                </div>
              </div>

              {/* Stock Toggle */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-400">
                  {item.isAvailable ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> In Stock
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Sold Out
                    </span>
                  )}
                </span>

                <button
                  onClick={() =>
                    handleToggleAvailability(item.id, item.isAvailable, item.name)
                  }
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition border ${
                    item.isAvailable
                      ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border-rose-500/30'
                      : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border-emerald-500/30'
                  }`}
                >
                  {item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal */}
      {showItemModal && (
        <Modal
          isOpen={showItemModal}
          onClose={() => setShowItemModal(false)}
          title="Add New Food Item"
          subtitle="Define dish details, prices, variants, and dietary tags."
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateItem} className="space-y-4 text-xs text-stone-200">
            {error && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Category *</label>
                <select
                  required
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Dietary Classification *</label>
                <select
                  value={itemForm.foodType}
                  onChange={(e) => setItemForm({ ...itemForm, foodType: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100"
                >
                  <option value="VEG">🟢 Vegetarian</option>
                  <option value="NON_VEG">🔴 Non-Vegetarian</option>
                  <option value="EGG">🟡 Contains Egg</option>
                  <option value="VEGAN">🌱 100% Vegan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Item Name *</label>
              <input
                type="text"
                required
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="e.g. Avocado Toast with Poached Egg"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Description</label>
              <textarea
                rows={2}
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Artisanal sourdough toast topped with fresh guacamole and heirloom tomatoes."
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Base Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={itemForm.basePrice}
                  onChange={(e) => setItemForm({ ...itemForm, basePrice: e.target.value })}
                  placeholder="249"
                  className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Prep Time (Mins)</label>
                <input
                  type="number"
                  value={itemForm.preparationMinutes}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, preparationMinutes: Number(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Image URL (Unsplash / CDN)</label>
              <input
                type="url"
                value={itemForm.image}
                onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
              {itemForm.image && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={itemForm.image}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-stone-800"
                  />
                  <span className="text-[11px] text-stone-400">Image Preview</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isFeatured}
                  onChange={(e) => setItemForm({ ...itemForm, isFeatured: e.target.checked })}
                  className="rounded border-stone-800 text-amber-500 bg-stone-900"
                />
                <span>Featured Dish</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-stone-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={itemForm.isBestseller}
                  onChange={(e) => setItemForm({ ...itemForm, isBestseller: e.target.checked })}
                  className="rounded border-stone-800 text-amber-500 bg-stone-900"
                />
                <span>Chef Bestseller</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 shadow-md shadow-amber-950/40"
              >
                {submitting ? 'Saving...' : 'Save Food Item'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <Modal
          isOpen={showCatModal}
          onClose={() => setShowCatModal(false)}
          title="Create Menu Category"
          subtitle="Group your dishes logically (e.g. Beverages, Mains, Desserts)"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs text-stone-200">
            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Category Name *</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Specialty Coffees"
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div>
              <label className="font-bold text-stone-300 uppercase tracking-wider text-[10px]">Description (Optional)</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Single-origin beans and manual brews."
                className="mt-1 w-full px-3 py-2 border border-stone-800 rounded-xl text-sm bg-stone-900 text-stone-100 placeholder:text-stone-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 shadow-md shadow-amber-950/40"
              >
                {submitting ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && (
        <Modal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          title="Bulk CSV Menu Import"
          subtitle="Paste CSV text with columns: Category, Item Name, Description, Price, Food Type, Prep Time"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs text-stone-200">
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => setCsvContent(e.target.value)}
              placeholder={`Category,Item Name,Description,Price,Food Type,Prep Time
Artisanal Coffee,Flat White,Velvety double shot espresso,169,VEG,5
Stonebaked Pizza,Margherita Bufala,Fresh buffalo mozzarella,399,VEG,15`}
              className="w-full font-mono text-xs p-3 border border-stone-800 rounded-xl bg-stone-900 text-stone-100 focus:border-amber-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 border border-stone-800 rounded-xl text-xs font-semibold text-stone-400 hover:bg-stone-850"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvImport}
                disabled={submitting || !csvContent.trim()}
                className="px-5 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 shadow-md shadow-amber-950/40 disabled:opacity-50"
              >
                {submitting ? 'Importing...' : 'Parse & Import CSV'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
