'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Clock,
  MapPin,
  Plus,
  Minus,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  TableProperties,
  UtensilsCrossed,
  Coffee,
  Star,
  Check,
  ChevronRight,
  Flame,
  Leaf,
  Drumstick,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from '@/types';
import { getStoredCart, saveStoredCart } from '@/lib/cartStore';
import { soundFx } from '@/components/ui/AudioAlert';
import { FALLBACK_CATEGORIES, CategoryData, MenuItemData } from '@/data/fallbackMenu';

/**
 * Utility to convert raw image URLs into highly compressed, auto-formatted WebP/AVIF images
 * with dimensions tailored to the exact display size. Reduces payload size by up to 95%.
 */
function getOptimizedImageUrl(url?: string | null, width = 220, quality = 70): string {
  if (!url) return '';
  if (url.includes('images.unsplash.com')) {
    try {
      const u = new URL(url);
      u.searchParams.set('auto', 'format');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('w', width.toString());
      u.searchParams.set('q', quality.toString());
      return u.toString();
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * High-performance thumbnail with:
 * - Instant pulse skeleton shimmer
 * - Eager preloading for above-the-fold hero items
 * - Non-blocking async decoding
 * - Graceful fallback on slow/dropped networks
 */
function MenuThumbnail({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const optimizedSrc = useMemo(() => getOptimizedImageUrl(src, 220, 70), [src]);

  if (error || !src) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FAF7F0] border border-[#E8DFD0] flex items-center justify-center text-[#7A6B58] shrink-0">
        <UtensilsCrossed className="w-5 h-5 opacity-30 text-[#123D2E]" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#EFE5D2] border border-[#E8DFD0] shadow-sm shrink-0 relative group-hover:scale-105 transition-transform duration-200">
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EFE5D2] via-[#F8F4EC] to-[#EFE5D2] animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function CustomerMenuPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get('table');

  // Instant client-side cached state for 0ms initial paint on reloads
  const [cafe, setCafe] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`nordic_cafe_${params.slug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.name) return parsed;
        }
      } catch {}
    }
    return {
      name: 'Nordic Roast & Bakery',
      slug: 'nordic-roast',
      description: 'Specialty Roastery & Hearth Bakery • Where Slow Hearth Baking Meets Specialty Nordic Roasting',
      todayHours: '8:00 AM – 11:00 PM Daily',
      branches: [{ address: 'SCO 142-143, Inner Market, Sector 35-C, Chandigarh, 160022' }],
    };
  });

  const [categories, setCategories] = useState<CategoryData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(`nordic_menu_${params.slug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return FALLBACK_CATEGORIES;
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER'>('ALL');
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK_CATEGORIES[0]?.id || '');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Selected Item Modal for customization
  const [customizingItem, setCustomizingItem] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    setCart(getStoredCart(params.slug));

    // Stale-While-Revalidate background fetch
    Promise.all([
      fetch(`/api/v1/public/c/${params.slug}`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/v1/public/c/${params.slug}/menu`)
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([cData, mData]) => {
        if (cData?.success && cData.cafe) {
          setCafe(cData.cafe);
          try {
            sessionStorage.setItem(`nordic_cafe_${params.slug}`, JSON.stringify(cData.cafe));
          } catch {}
        }
        if (mData?.success && Array.isArray(mData.categories) && mData.categories.length > 0) {
          setCategories(mData.categories);
          setActiveCategory((prev) => prev || mData.categories[0].id);
          try {
            sessionStorage.setItem(`nordic_menu_${params.slug}`, JSON.stringify(mData.categories));
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    saveStoredCart(params.slug, cart);
  }, [cart, params.slug]);

  // Open customization modal
  const handleOpenItem = (item: any) => {
    if (!item.isAvailable) return;
    setCustomizingItem(item);
    const defaultVar = item.variants?.find((v: any) => v.isDefault) || item.variants?.[0] || null;
    setSelectedVariant(defaultVar);
    setSelectedAddons([]);
    setQuantity(1);
    setSpecialInstructions('');
  };

  const toggleAddon = (addon: any) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCart = () => {
    if (!customizingItem) return;

    const basePrice = selectedVariant ? selectedVariant.price : customizingItem.basePrice;
    const addonsTotal = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    const itemTotalPrice = (basePrice + addonsTotal) * quantity;

    const cartId = `${customizingItem.id}-${selectedVariant?.id || 'base'}-${selectedAddons
      .map((a) => a.id)
      .sort()
      .join('-')}`;

    const existingIndex = cart.findIndex((c) => c.id === cartId);
    let updatedCart = [...cart];

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].itemTotalPrice += itemTotalPrice;
    } else {
      const newCartItem: CartItem = {
        id: cartId,
        menuItemId: customizingItem.id,
        name: customizingItem.name,
        foodType: customizingItem.foodType,
        basePrice,
        image: customizingItem.image || null,
        variant: selectedVariant
          ? {
              id: selectedVariant.id,
              name: selectedVariant.name,
              price: selectedVariant.price,
            }
          : undefined,
        addons: selectedAddons.map((a) => ({
          id: a.id,
          name: a.name,
          price: a.price,
        })),
        specialInstructions: specialInstructions.trim() || undefined,
        quantity,
        itemTotalPrice,
      };
      updatedCart.push(newCartItem);
    }

    setCart(updatedCart);
    setCustomizingItem(null);
    soundFx.playSuccess();
  };

  const handleIncrementItem = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    if (item.variants && item.variants.length > 1) {
      handleOpenItem(item);
      return;
    }
    const defaultVar = item.variants?.[0];
    const basePrice = defaultVar ? defaultVar.price : item.basePrice;
    const cartId = `${item.id}-${defaultVar?.id || 'base'}-`;

    const existingIndex = cart.findIndex((c) => c.menuItemId === item.id);
    let updated = [...cart];

    if (existingIndex > -1) {
      updated[existingIndex].quantity += 1;
      const unit = updated[existingIndex].itemTotalPrice / (updated[existingIndex].quantity - 1);
      updated[existingIndex].itemTotalPrice = unit * updated[existingIndex].quantity;
    } else {
      updated.push({
        id: cartId,
        menuItemId: item.id,
        name: item.name,
        foodType: item.foodType,
        basePrice,
        image: item.image || null,
        variant: defaultVar
          ? { id: defaultVar.id, name: defaultVar.name, price: defaultVar.price }
          : undefined,
        addons: [],
        quantity: 1,
        itemTotalPrice: basePrice,
      });
    }

    setCart(updated);
    soundFx.playBlip();
  };

  const handleDecrementItem = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const existingIndex = cart.findIndex((c) => c.menuItemId === item.id);
    if (existingIndex > -1) {
      let updated = [...cart];
      if (updated[existingIndex].quantity <= 1) {
        updated.splice(existingIndex, 1);
      } else {
        const unit = updated[existingIndex].itemTotalPrice / updated[existingIndex].quantity;
        updated[existingIndex].quantity -= 1;
        updated[existingIndex].itemTotalPrice = unit * updated[existingIndex].quantity;
      }
      setCart(updated);
      soundFx.playBlip();
    }
  };

  const handleCartItemQuantityChange = (cartItemId: string, delta: number) => {
    const idx = cart.findIndex((c) => c.id === cartItemId);
    if (idx === -1) return;

    const updated = [...cart];
    const unitPrice = updated[idx].itemTotalPrice / updated[idx].quantity;

    if (updated[idx].quantity + delta <= 0) {
      updated.splice(idx, 1);
    } else {
      updated[idx].quantity += delta;
      updated[idx].itemTotalPrice = unitPrice * updated[idx].quantity;
    }
    setCart(updated);
    soundFx.playBlip();
  };

  const getItemCartQty = (itemId: string) => {
    return cart
      .filter((c) => c.menuItemId === itemId)
      .reduce((sum, c) => sum + c.quantity, 0);
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartSubtotal = cart.reduce((acc, it) => acc + it.itemTotalPrice, 0);

  // Statistics for Filter Badges
  const allItemsList = useMemo(() => {
    return categories.flatMap((c) => c.menuItems);
  }, [categories]);

  const vegCount = useMemo(() => {
    return allItemsList.filter((i) => i.foodType === 'VEG').length;
  }, [allItemsList]);

  const nonVegCount = useMemo(() => {
    return allItemsList.filter((i) => i.foodType === 'NON_VEG').length;
  }, [allItemsList]);

  const bestsellerCount = useMemo(() => {
    return allItemsList.filter((i) => i.isBestseller).length;
  }, [allItemsList]);

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-[#123D2E]">
        <div className="w-14 h-14 rounded-full bg-[#123D2E] flex items-center justify-center text-[#E6AD38] shadow-xl mb-4 animate-bounce">
          <Coffee className="w-7 h-7" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#E6AD38] mb-2" />
        <span className="text-xs font-semibold tracking-widest uppercase text-[#123D2E]">
          Loading Handcrafted Menu...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#162720] selection:bg-[#E6AD38] selection:text-[#09291F] font-sans antialiased pb-24">
      {/* =========================================================================
          1. DINE-IN TABLE ALERT BANNER (If scanning a dining table QR)
          ========================================================================= */}
      {tableParam && (
        <div className="sticky top-0 z-50 bg-[#E6AD38] text-[#09291F] px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold shadow-md border-b border-[#D6B36A]">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <TableProperties className="w-4 h-4 text-[#09291F] shrink-0" />
              <span className="truncate">
                Dining at Table:{' '}
                <strong className="underline uppercase tracking-wider font-mono text-[#09291F]">
                  {tableParam}
                </strong>
              </span>
            </div>
            <span className="text-[10px] bg-[#09291F] text-[#E6AD38] px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
              Contactless Ordering
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. CLEAN TOP CAFE IDENTITY & BRANDING (No Extra Tabs)
          ========================================================================= */}
      <header className="bg-[#09291F] text-[#F7F1E5] border-b border-[#1C5A40] shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Brand & Tagline */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#123D2E] to-[#1C5A40] border border-[#E6AD38]/40 flex items-center justify-center text-[#E6AD38] shadow-md shrink-0">
              <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-serif font-black text-base sm:text-xl lg:text-2xl tracking-tight text-white truncate">
                  {cafe.name || 'Nordic Roast & Bakery'}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Kitchen
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#D6B36A] font-medium tracking-wide truncate">
                Specialty Roastery &amp; Hearth Bakery • Sector 35-C
              </p>
            </div>
          </div>

          {/* Quick Header Actions (Order Tracker & Live Cart Trigger) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/lookup"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#F7F1E5] hover:text-[#E6AD38] hover:bg-[#123D2E] transition border border-[#1C5A40]"
              title="Track previous orders"
            >
              <Clock className="w-3.5 h-3.5 text-[#E6AD38]" />
              <span>Track</span>
            </Link>

            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] text-[#09291F] font-black text-xs shadow-md hover:brightness-105 transition active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono">
                {totalCartCount > 0 ? (
                  <span>
                    {totalCartCount} • {formatCurrency(totalCartSubtotal)}
                  </span>
                ) : (
                  <span>Cart</span>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Cafe Highlights Bar: Hours, Rating, Atmosphere */}
        <div className="bg-[#051711] border-t border-[#143B2B] px-3 sm:px-6 py-1.5">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[10px] sm:text-[11px] text-[#C9BEAA] overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium">Open: 8:00 AM – 11:00 PM</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-[#E6AD38]">
              <Star className="w-3 h-3 fill-current" />
              <span className="font-bold text-white">4.9</span>
              <span className="text-[#C9BEAA]">(1,400+ Reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 hidden xs:flex">
              <Flame className="w-3 h-3 text-[#E6AD38]" />
              <span>Stone Hearth Oven</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 hidden sm:flex">
              <Sparkles className="w-3 h-3 text-[#E6AD38]" />
              <span>36-Hour Sourdough Fermentation</span>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          3. SEARCH & VEG / NON-VEG DIETARY FILTER PILLS
          ========================================================================= */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
          {/* Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6B58]" />
            <input
              type="text"
              placeholder="Search 45 handcrafted dishes, coffees, sourdough pizzas, melts, croissants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[#FAF7F0] rounded-xl border border-[#E8DFD0] text-[#162720] text-xs sm:text-sm focus:outline-none focus:border-[#123D2E] focus:bg-white placeholder-[#8F8170] transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8170] hover:text-[#162720]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Veg / Non-Veg Dietary Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar text-xs font-bold">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
                dietaryFilter === 'ALL'
                  ? 'bg-[#09291F] text-white shadow-sm'
                  : 'bg-[#FAF7F0] border border-[#E8DFD0] text-[#4A3D2D] hover:bg-[#F3ECE0]'
              }`}
            >
              All Items ({allItemsList.length})
            </button>

            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                dietaryFilter === 'VEG'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-[#FAF7F0] border border-[#E8DFD0] text-emerald-800 hover:bg-[#F3ECE0]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Pure Veg ({vegCount})</span>
            </button>

            <button
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                dietaryFilter === 'NON_VEG'
                  ? 'bg-rose-800 text-white shadow-sm'
                  : 'bg-[#FAF7F0] border border-[#E8DFD0] text-rose-800 hover:bg-[#F3ECE0]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Non-Veg ({nonVegCount})</span>
            </button>

            <button
              onClick={() => setDietaryFilter('BESTSELLER')}
              className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                dietaryFilter === 'BESTSELLER'
                  ? 'bg-[#E6AD38] text-[#09291F] shadow-sm'
                  : 'bg-[#FAF7F0] border border-[#E8DFD0] text-[#B45309] hover:bg-[#F3ECE0]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>Bestsellers ({bestsellerCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. STICKY HORIZONTAL CATEGORY NAVIGATION BAR
          ========================================================================= */}
      <div className="sticky top-[58px] sm:top-[68px] z-30 bg-[#FBF8F3]/95 backdrop-blur-md border-y border-[#E8DFD0] py-2.5 mt-3 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => {
            const isActive = activeCategory === c.id;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive
                    ? 'bg-[#09291F] text-[#E6AD38] shadow-sm font-black'
                    : 'bg-white text-[#4A3D2D] hover:bg-[#EFE5D2] border border-[#E8DFD0]'
                }`}
              >
                {c.name}
              </a>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          5. CATEGORY SECTIONS (Inspired by Image 3 Traditional Menu Layout)
          ========================================================================= */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 mt-6 space-y-10 sm:space-y-12">
        {categories.map((cat, catIdx) => {
          // Filter items based on active search & dietary preference
          const filteredItems = cat.menuItems.filter((item: any) => {
            const matchesSearch =
              !search ||
              item.name.toLowerCase().includes(search.toLowerCase()) ||
              (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

            if (!matchesSearch) return false;

            if (dietaryFilter === 'VEG') return item.foodType === 'VEG' || item.foodType === 'VEGAN';
            if (dietaryFilter === 'NON_VEG') return item.foodType === 'NON_VEG';
            if (dietaryFilter === 'BESTSELLER') return item.isBestseller;

            return true;
          });

          if (filteredItems.length === 0) return null;

          const vegItems = filteredItems.filter((i: any) => i.foodType === 'VEG' || i.foodType === 'VEGAN');
          const nonVegItems = filteredItems.filter((i: any) => i.foodType === 'NON_VEG');
          const hasMixedSubsections = vegItems.length > 0 && nonVegItems.length > 0;

          return (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="scroll-mt-28 space-y-4 bg-white/70 border border-[#E8DFD0] rounded-3xl p-3 sm:p-6 shadow-sm backdrop-blur-sm"
            >
              {/* Category Ribbon Banner Header (Inspired by Image 3 ribbon style) */}
              <div className="flex flex-col items-center pt-2 pb-1">
                <div className="relative inline-flex items-center justify-center max-w-full">
                  {/* Left Ribbon Swallowtail Wing */}
                  <svg
                    className="w-4 sm:w-6 h-8 sm:h-10 text-[#071E16] drop-shadow -mr-1 shrink-0"
                    viewBox="0 0 24 40"
                    fill="currentColor"
                  >
                    <path d="M24 0 L0 0 L10 20 L0 40 L24 40 Z" />
                  </svg>
                  {/* Ribbon Center Body */}
                  <div className="bg-gradient-to-r from-[#09291F] via-[#123D2E] to-[#09291F] text-white px-4 sm:px-8 py-1.5 sm:py-2 border-y-2 border-[#E6AD38] shadow-md flex items-center gap-2 sm:gap-3 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E6AD38] shrink-0" />
                    <h2 className="text-sm sm:text-lg lg:text-xl font-serif font-black tracking-wider uppercase text-[#F7F1E5] text-center truncate">
                      {cat.name}
                    </h2>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E6AD38] shrink-0" />
                  </div>
                  {/* Right Ribbon Swallowtail Wing */}
                  <svg
                    className="w-4 sm:w-6 h-8 sm:h-10 text-[#071E16] drop-shadow -ml-1 shrink-0"
                    viewBox="0 0 24 40"
                    fill="currentColor"
                  >
                    <path d="M0 0 L24 0 L14 20 L24 40 L0 40 Z" />
                  </svg>
                </div>
                {cat.description && (
                  <p className="text-center text-xs text-[#7A6B58] font-light max-w-xl mx-auto italic mt-1.5 px-2">
                    {cat.description}
                  </p>
                )}
              </div>

              {/* SECTION SUB-GROUPINGS: Veg / Non-Veg Subsections (Like Image 3) */}
              {hasMixedSubsections ? (
                <div className="space-y-6 pt-2">
                  {/* Veg Subsection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b-2 border-emerald-600/30 pb-1.5 pt-2">
                      <div className="w-3.5 h-3.5 rounded-sm border-2 border-emerald-600 flex items-center justify-center p-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      </div>
                      <h3 className="font-serif font-extrabold text-sm sm:text-base text-emerald-950 uppercase tracking-wide">
                        Vegetarian Creations :
                      </h3>
                      <span className="text-[11px] font-mono text-emerald-700 font-semibold ml-auto">
                        ({vegItems.length} items)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {vegItems.map((item: any, idx: number) => renderMenuItemCard(item, catIdx === 0 && idx < 4))}
                    </div>
                  </div>

                  {/* Non-Veg Subsection */}
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center gap-2 border-b-2 border-rose-600/30 pb-1.5 pt-2">
                      <div className="w-3.5 h-3.5 rounded-sm border-2 border-rose-600 flex items-center justify-center p-0.5">
                        <div className="w-2 h-2 rounded-full bg-rose-600" />
                      </div>
                      <h3 className="font-serif font-extrabold text-sm sm:text-base text-rose-950 uppercase tracking-wide">
                        Non-Vegetarian &amp; Hearth Roasts :
                      </h3>
                      <span className="text-[11px] font-mono text-rose-700 font-semibold ml-auto">
                        ({nonVegItems.length} items)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {nonVegItems.map((item: any, idx: number) => renderMenuItemCard(item, catIdx === 0 && idx < 4))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Single Dietary Type Category Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
                  {filteredItems.map((item: any, idx: number) => renderMenuItemCard(item, catIdx === 0 && idx < 6))}
                </div>
              )}
            </section>
          );
        })}

        {/* Menu Footer / Regulatory Notice (Like Image 3 footnote) */}
        <div className="pt-8 pb-12 text-center space-y-2 border-t border-[#E8DFD0]/60 mt-12">
          <p className="text-xs text-[#7A6B58] font-serif italic">
            * All prices are in Indian Rupees (₹) and exclusive of applicable GST.
          </p>
          <p className="text-[11px] text-[#A89885] font-light max-w-md mx-auto">
            Every dish is handcrafted to order using wild-fermented sourdough, European butter, and ethically sourced single-origin Arabica micro-lots.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-mono font-bold text-[#123D2E]">
            <span>NORDIC ROAST &amp; BAKERY</span>
            <span>•</span>
            <span>SECTOR 35-C CHANDIGARH</span>
          </div>
        </div>
      </main>

      {/* =========================================================================
          6. PRODUCT CUSTOMIZATION MODAL (Bottom Sheet on Mobile, Centered on Desktop)
          ========================================================================= */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#FAF7F0] border border-[#E8DFD0] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col justify-between text-[#162720]">
            {/* Header & Image */}
            <div>
              <div className="relative">
                {customizingItem.image && (
                  <img
                    src={getOptimizedImageUrl(customizingItem.image, 600, 75)}
                    alt={customizingItem.name}
                    loading="eager"
                    decoding="async"
                    className="w-full h-44 sm:h-52 object-cover"
                  />
                )}
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 right-3 p-2 bg-[#09291F]/80 backdrop-blur-md text-white hover:bg-[#09291F] rounded-full shadow-md transition"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 shrink-0 ${
                          customizingItem.foodType === 'NON_VEG'
                            ? 'border-rose-600'
                            : 'border-emerald-600'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            customizingItem.foodType === 'NON_VEG'
                              ? 'bg-rose-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                      </div>
                      <h2 className="text-lg sm:text-xl font-serif font-black text-[#09291F]">
                        {customizingItem.name}
                      </h2>
                    </div>
                    <span className="text-base sm:text-lg font-black text-[#123D2E] font-mono shrink-0">
                      {formatCurrency(
                        selectedVariant ? selectedVariant.price : customizingItem.basePrice
                      )}
                    </span>
                  </div>
                  {customizingItem.description && (
                    <p className="text-xs text-[#5C4D3C] mt-1.5 leading-relaxed font-light">
                      {customizingItem.description}
                    </p>
                  )}
                </div>

                {/* Variants Selection */}
                {customizingItem.variants && customizingItem.variants.length > 0 && (
                  <div className="space-y-2 pt-2.5 border-t border-[#E8DFD0]">
                    <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                      Choose Size / Option *
                    </label>
                    <div className="space-y-1.5">
                      {customizingItem.variants.map((v: any) => (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                            selectedVariant?.id === v.id
                              ? 'border-[#09291F] bg-[#09291F]/10 text-[#09291F] font-bold'
                              : 'border-[#E8DFD0] bg-white hover:bg-[#F3ECE0] text-[#5C4D3C]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="variant"
                              checked={selectedVariant?.id === v.id}
                              onChange={() => setSelectedVariant(v)}
                              className="text-[#09291F] focus:ring-[#09291F]"
                            />
                            <span>{v.name}</span>
                          </div>
                          <span className="font-mono font-bold text-[#123D2E]">
                            {formatCurrency(v.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add-ons List */}
                {customizingItem.menuItemAddonGroups &&
                  customizingItem.menuItemAddonGroups.length > 0 && (
                    <div className="space-y-3 pt-2.5 border-t border-[#E8DFD0]">
                      {customizingItem.menuItemAddonGroups.map((grp: any) => (
                        <div key={grp.addonGroup.id} className="space-y-1.5">
                          <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                            {grp.addonGroup.name} (Optional)
                          </label>
                          <div className="space-y-1.5">
                            {grp.addonGroup.options.map((opt: any) => {
                              const isChecked = selectedAddons.some((a) => a.id === opt.id);
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition ${
                                    isChecked
                                      ? 'border-[#09291F] bg-[#09291F]/10 text-[#09291F] font-semibold'
                                      : 'border-[#E8DFD0] bg-white hover:bg-[#F3ECE0] text-[#5C4D3C]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleAddon(opt)}
                                      className="rounded text-[#09291F] focus:ring-[#09291F]"
                                    />
                                    <span>{opt.name}</span>
                                  </div>
                                  <span className="font-mono text-[#123D2E]">
                                    +{formatCurrency(opt.price)}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Special Instructions */}
                <div className="space-y-1.5 pt-2.5 border-t border-[#E8DFD0]">
                  <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                    Special Preparation Note
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra hot oat milk on side, no ice, less sugar"
                    className="w-full px-3 py-2 text-xs border border-[#E8DFD0] bg-white text-[#162720] placeholder-[#8F8170] rounded-xl focus:outline-none focus:border-[#09291F]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Stepper & Add Button */}
            <div className="p-3.5 sm:p-5 bg-white border-t border-[#E8DFD0] flex items-center justify-between gap-3 sticky bottom-0">
              <div className="flex items-center gap-1.5 bg-[#FAF7F0] border border-[#E8DFD0] rounded-xl p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#123D2E] hover:bg-white transition"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-extrabold text-xs sm:text-sm text-[#09291F] font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[#123D2E] hover:bg-white transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-[#E6AD38] hover:bg-[#D6B36A] text-[#09291F] rounded-xl text-xs font-black shadow-md flex items-center justify-between px-4 transition active:scale-98 uppercase tracking-wider font-mono"
              >
                <span>Add to Cart</span>
                <span>
                  {formatCurrency(
                    ((selectedVariant ? selectedVariant.price : customizingItem.basePrice) +
                      selectedAddons.reduce((acc, a) => acc + a.price, 0)) *
                      quantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. BOTTOM FLOATING CART SUMMARY (Mobile & Desktop)
          ========================================================================= */}
      {cart.length > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-3 sm:px-4 max-w-lg mx-auto animate-in slide-in-from-bottom-5 duration-200">
          <div
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center justify-between p-3 sm:p-3.5 bg-[#09291F] text-[#F7F1E5] rounded-2xl shadow-2xl hover:bg-[#123D2E] transition-all group border border-[#1C5A40] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#E6AD38] text-[#09291F] flex items-center justify-center font-black text-xs font-mono shadow-md">
                {totalCartCount}
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-white">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in cart
                </div>
                <div className="text-[11px] text-[#D6B36A] font-mono">
                  Subtotal: <strong className="text-[#E6AD38]">{formatCurrency(totalCartSubtotal)}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E6AD38] text-[#09291F] rounded-xl text-xs font-black uppercase tracking-wider group-hover:bg-[#D6B36A] transition">
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. SLIDE-OVER CART DRAWER
          ========================================================================= */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-[#FAF7F0] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E8DFD0] text-[#162720] animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 bg-[#09291F] text-white flex items-center justify-between border-b border-[#1C5A40]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#E6AD38]" />
                <h3 className="font-serif font-black text-base sm:text-lg">Your Cafe Cart</h3>
                <span className="text-xs font-mono font-bold bg-[#123D2E] text-[#E6AD38] px-2 py-0.5 rounded-full border border-[#E6AD38]/30">
                  {totalCartCount}
                </span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#123D2E] text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#7A6B58] space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-[#D6B36A]" />
                  <p className="font-bold text-sm text-[#09291F]">Your cart is empty</p>
                  <p className="text-xs">Select dishes from the menu above to start your order.</p>
                </div>
              ) : (
                cart.map((it) => (
                  <div
                    key={it.id}
                    className="bg-white p-3 rounded-2xl border border-[#E8DFD0] shadow-sm flex items-start justify-between gap-2.5"
                  >
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-[#09291F] truncate">
                        {it.name}
                      </h4>
                      {it.variant && (
                        <p className="text-[10px] sm:text-[11px] text-[#123D2E] font-medium font-mono">
                          Size: {it.variant.name}
                        </p>
                      )}
                      {it.addons && it.addons.length > 0 && (
                        <p className="text-[10px] text-[#7A6B58] truncate">
                          + {it.addons.map((a: any) => a.name).join(', ')}
                        </p>
                      )}
                      {it.specialInstructions && (
                        <p className="text-[10px] text-[#B45309] italic truncate">
                          Note: "{it.specialInstructions}"
                        </p>
                      )}
                      <div className="text-xs font-black text-[#123D2E] font-mono pt-1">
                        {formatCurrency(it.itemTotalPrice)}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1 bg-[#FAF7F0] border border-[#E8DFD0] rounded-xl p-0.5 shrink-0">
                      <button
                        onClick={() => handleCartItemQuantityChange(it.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#123D2E] hover:bg-white rounded-lg transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold font-mono">
                        {it.quantity}
                      </span>
                      <button
                        onClick={() => handleCartItemQuantityChange(it.id, 1)}
                        className="w-6 h-6 flex items-center justify-center text-[#123D2E] hover:bg-white rounded-lg transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer & Checkout CTA */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 bg-white border-t border-[#E8DFD0] space-y-2.5">
                <div className="flex justify-between text-xs text-[#5C4D3C]">
                  <span>Item Subtotal</span>
                  <span className="font-mono font-bold text-[#09291F]">
                    {formatCurrency(totalCartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#5C4D3C]">
                  <span>Estimated Taxes (GST 5%)</span>
                  <span className="font-mono font-bold text-[#09291F]">
                    {formatCurrency(Math.round(totalCartSubtotal * 0.05))}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-serif font-black text-[#09291F] pt-2 border-t border-[#E8DFD0]">
                  <span>Estimated Total</span>
                  <span className="font-mono text-[#123D2E]">
                    {formatCurrency(Math.round(totalCartSubtotal * 1.05))}
                  </span>
                </div>

                <Link
                  href={`/c/${params.slug}/checkout${tableParam ? `?table=${tableParam}` : ''}`}
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-3 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] text-[#09291F] font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 uppercase tracking-wider font-mono transition active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Helper function to render a single menu item card inspired by Image 3:
   * Displays dotted leader line, dish name, price, description, veg/non-veg dot, image and add button.
   */
  function renderMenuItemCard(item: any, isAboveFold = false) {
    const itemCartQty = getItemCartQty(item.id);
    const hasVariants = item.variants && item.variants.length > 1;

    return (
      <div
        key={item.id}
        onClick={() => handleOpenItem(item)}
        className="bg-white border border-[#E8DFD0] rounded-2xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group active:scale-[0.99] gap-2.5"
      >
        <div className="flex items-start justify-between gap-3">
          {/* Left Text Column: Title, Dotted line, Price, Description */}
          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Top row: Veg Dot + Title + Dotted Leader + Price */}
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              {/* Veg / Non-Veg Official Symbol */}
              <div
                className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center p-0.5 shrink-0 self-center ${
                  item.foodType === 'NON_VEG' ? 'border-rose-600' : 'border-emerald-600'
                }`}
                title={item.foodType === 'NON_VEG' ? 'Non-Vegetarian' : 'Pure Vegetarian'}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    item.foodType === 'NON_VEG' ? 'bg-rose-600' : 'bg-emerald-600'
                  }`}
                />
              </div>

              {/* Dish Name */}
              <h4 className="font-serif font-black text-xs sm:text-sm lg:text-base text-[#09291F] group-hover:text-[#123D2E] transition leading-snug">
                {item.name}
              </h4>

              {/* Image 3 Inspired Dotted Leader Line */}
              <span className="flex-1 border-b border-dotted border-[#C9BEAA] mx-1.5 shrink min-w-[8px] self-end mb-1 inline-block" />

              {/* Price */}
              <span className="font-mono font-black text-xs sm:text-sm text-[#123D2E] shrink-0 self-baseline">
                {hasVariants && <span className="text-[10px] text-[#7A6B58] font-normal mr-0.5">from </span>}
                {formatCurrency(item.basePrice)}
              </span>
            </div>

            {/* Description */}
            {item.description && (
              <p className="text-[11px] sm:text-xs text-[#5C4D3C] line-clamp-2 leading-relaxed font-light">
                {item.description}
              </p>
            )}

            {/* Tags: Bestseller / Prep time / Variants */}
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {item.isBestseller && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-current" />
                  <span>Bestseller</span>
                </span>
              )}
              {hasVariants && (
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                  Customizable
                </span>
              )}
            </div>
          </div>

          {/* Right Image Thumbnail (Optimized WebP + Fast Skeleton Shimmer) */}
          {item.image && (
            <MenuThumbnail
              src={item.image}
              alt={item.name}
              priority={isAboveFold}
            />
          )}
        </div>

        {/* Bottom Action Strip: Quick Add Stepper */}
        <div className="pt-2 border-t border-[#F0E9DC] flex items-center justify-between">
          <span className="text-[10px] text-[#7A6B58] font-mono">
            {item.preparationMinutes ? `~${item.preparationMinutes} mins prep` : 'Freshly made'}
          </span>

          <div onClick={(e) => e.stopPropagation()}>
            {itemCartQty > 0 ? (
              <div className="flex items-center bg-[#09291F] text-white rounded-xl shadow-sm overflow-hidden p-0.5">
                <button
                  type="button"
                  onClick={(e) => handleDecrementItem(e, item)}
                  className="w-7 h-6 flex items-center justify-center text-[#E6AD38] hover:bg-[#123D2E] transition"
                >
                  <Minus className="w-3 h-3 stroke-[3]" />
                </button>
                <span className="px-2 font-black text-xs text-white font-mono select-none">
                  {itemCartQty}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleIncrementItem(e, item)}
                  className="w-7 h-6 flex items-center justify-center text-[#E6AD38] hover:bg-[#123D2E] transition"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => handleIncrementItem(e, item)}
                className="px-3.5 py-1.5 bg-[#E6AD38] hover:bg-[#D6B36A] text-[#09291F] font-black text-xs rounded-xl shadow-sm transition flex items-center gap-1 uppercase tracking-wider font-mono active:scale-95"
              >
                <span>Add</span>
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
