'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  Plus,
  Minus,
  Check,
  X,
  Sparkles,
  ArrowRight,
  Loader2,
  TableProperties,
  UtensilsCrossed,
  ChevronRight,
  Coffee,
  Menu as MenuIcon,
  Star,
  ShieldCheck,
  Heart,
  Award,
  Flame,
  Wheat,
  Share2,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from '@/types';
import { getStoredCart, saveStoredCart, clearStoredCart } from '@/lib/cartStore';
import { soundFx } from '@/components/ui/AudioAlert';

export default function CustomerMenuPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get('table');

  const [cafe, setCafe] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON_VEG' | 'BESTSELLER'>('ALL');
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    Promise.all([
      fetch(`/api/v1/public/c/${params.slug}`).then((r) => r.json()),
      fetch(`/api/v1/public/c/${params.slug}/menu`).then((r) => r.json()),
    ])
      .then(([cData, mData]) => {
        if (cData.success) setCafe(cData.cafe);
        if (mData.success) {
          setCategories(mData.categories);
          if (mData.categories.length > 0) {
            setActiveCategory(mData.categories[0].id);
          }
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

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!customizingItem) return;

    const baseP = selectedVariant ? selectedVariant.price : customizingItem.basePrice;
    const addonsP = selectedAddons.reduce((acc, a) => acc + a.price, 0);
    const unitP = baseP + addonsP;

    const cartLineItem: CartItem = {
      id: `${customizingItem.id}_${selectedVariant?.id || 'std'}_${selectedAddons
        .map((a) => a.id)
        .sort()
        .join('-')}_${Date.now()}`,
      menuItemId: customizingItem.id,
      name: customizingItem.name,
      image: customizingItem.image,
      foodType: customizingItem.foodType,
      basePrice: customizingItem.basePrice,
      variant: selectedVariant
        ? {
            id: selectedVariant.id,
            name: selectedVariant.name,
            price: selectedVariant.price,
          }
        : null,
      addons: selectedAddons.map((a) => ({
        id: a.id,
        name: a.name,
        price: a.price,
      })),
      quantity,
      itemTotalPrice: unitP * quantity,
      specialInstructions: specialInstructions.trim() || undefined,
    };

    setCart((prev) => [...prev, cartLineItem]);
    setCustomizingItem(null);
    soundFx.playSuccess();
  };

  const getItemCartQty = (itemId: string) => {
    return cart
      .filter((c) => c.menuItemId === itemId)
      .reduce((acc, it) => acc + it.quantity, 0);
  };

  const handleIncrementItem = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const hasCustomizations =
      (item.variants && item.variants.length > 1) ||
      (item.menuItemAddonGroups && item.menuItemAddonGroups.length > 0);

    if (hasCustomizations) {
      handleOpenItem(item);
    } else {
      const existingIdx = cart.findIndex((c) => c.menuItemId === item.id);
      if (existingIdx > -1) {
        const updated = [...cart];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].itemTotalPrice =
          updated[existingIdx].basePrice * updated[existingIdx].quantity;
        setCart(updated);
        soundFx.playBlip();
      } else {
        const cartLineItem: CartItem = {
          id: `${item.id}_direct_${Date.now()}`,
          menuItemId: item.id,
          name: item.name,
          image: item.image,
          foodType: item.foodType,
          basePrice: item.basePrice,
          variant: null,
          addons: [],
          quantity: 1,
          itemTotalPrice: item.basePrice,
        };
        setCart((prev) => [...prev, cartLineItem]);
        soundFx.playBlip();
      }
    }
  };

  const handleDecrementItem = (e: React.MouseEvent, item: any) => {
    e.stopPropagation();
    const existingIdx = cart.findLastIndex((c) => c.menuItemId === item.id);
    if (existingIdx > -1) {
      const updated = [...cart];
      if (updated[existingIdx].quantity > 1) {
        updated[existingIdx].quantity -= 1;
        const unitP =
          updated[existingIdx].itemTotalPrice / (updated[existingIdx].quantity + 1);
        updated[existingIdx].itemTotalPrice =
          unitP * updated[existingIdx].quantity;
        setCart(updated);
      } else {
        updated.splice(existingIdx, 1);
        setCart(updated);
      }
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

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const totalCartSubtotal = cart.reduce((acc, it) => acc + it.itemTotalPrice, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F1E5] flex flex-col items-center justify-center p-6 text-[#123D2E]">
        <div className="w-14 h-14 rounded-full bg-[#123D2E] flex items-center justify-center text-[#E6AD38] shadow-xl mb-4 animate-bounce">
          <Coffee className="w-7 h-7" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#E6AD38] mb-2" />
        <span className="text-xs font-semibold tracking-widest uppercase text-[#123D2E]">
          Loading Nordic Roast & Bakery...
        </span>
      </div>
    );
  }

  if (!cafe) {
    return (
      <div className="min-h-screen bg-[#F7F1E5] flex flex-col items-center justify-center p-6 text-center text-[#123D2E]">
        <div className="w-16 h-16 rounded-2xl bg-[#EFE5D2] border border-[#E3D8C5] flex items-center justify-center text-[#123D2E] mb-3 shadow-md">
          <UtensilsCrossed className="w-8 h-8 text-[#E6AD38]" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#09291F]">Cafe Not Found</h2>
        <p className="text-sm text-[#563B2D] mt-2 max-w-sm">
          This digital menu link is invalid or the bakery is currently offline.
        </p>
        <Link
          href="/"
          className="mt-5 px-6 py-2.5 bg-[#123D2E] hover:bg-[#09291F] text-[#F7F1E5] rounded-xl text-xs font-bold shadow-md transition"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#09291F] selection:bg-[#E6AD38] selection:text-[#09291F] font-sans">
      {/* =========================================================================
          1. DINE-IN TABLE ALERT BANNER (If scanning a dining table QR)
          ========================================================================= */}
      {tableParam && (
        <div className="sticky top-0 z-50 bg-[#E6AD38] text-[#09291F] px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md border-b border-[#D6B36A]">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <TableProperties className="w-4 h-4 text-[#09291F]" />
            <span>
              Dining at Table:{' '}
              <strong className="underline uppercase tracking-wider font-mono text-[#09291F]">
                {tableParam}
              </strong>
            </span>
            <span className="ml-auto text-[10px] bg-[#09291F] text-[#E6AD38] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Contactless Table Ordering
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. LUXURY FOREST-GREEN STICKY HEADER & NAVIGATION
          ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#09291F] text-[#F7F1E5] border-b border-[#1C5A40] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Identity & Monogram */}
          <Link href={`/c/${params.slug}`} className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#123D2E] to-[#1C5A40] border border-[#E6AD38]/40 flex items-center justify-center text-[#E6AD38] shadow-lg shadow-black/30 group-hover:scale-105 transition">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-xl sm:text-2xl tracking-tight text-white">
                  Nordic Roast <span className="text-[#E6AD38]">&amp; Bakery</span>
                </span>
              </div>
              <p className="text-[11px] text-[#D6B36A] font-medium tracking-wide">
                Specialty Roastery &amp; Hearth Bakery
              </p>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-[#F7F1E5]/80">
            <a href="#hero" className="hover:text-[#E6AD38] transition font-bold text-[#E6AD38]">
              Home
            </a>
            <a href="#menu" className="hover:text-[#E6AD38] transition">
              Artisan Menu
            </a>
            <a href="#about" className="hover:text-[#E6AD38] transition">
              Our Story
            </a>
            <a href="#gallery" className="hover:text-[#E6AD38] transition">
              Cafe Gallery
            </a>
            <a href="#hours" className="hover:text-[#E6AD38] transition">
              Hours &amp; Location
            </a>
            <a href="#contact" className="hover:text-[#E6AD38] transition">
              Contact
            </a>
          </nav>

          {/* Right: Actions, Order Tracking, Cart, Order Now CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Track Order Link */}
            <Link
              href="/lookup"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#F7F1E5] hover:text-[#E6AD38] hover:bg-[#123D2E] transition border border-[#1C5A40]"
              title="Track previous order status"
            >
              <Clock className="w-3.5 h-3.5 text-[#E6AD38]" />
              <span>Track Order</span>
            </Link>

            {/* Cart Trigger Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 rounded-xl bg-[#123D2E] hover:bg-[#1C5A40] text-[#E6AD38] border border-[#E6AD38]/30 transition shadow-md flex items-center justify-center"
              title="View Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E6AD38] text-[#09291F] font-black text-[11px] flex items-center justify-center shadow-lg font-mono">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Primary Order Now Button */}
            <a
              href="#menu"
              className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] text-[#09291F] rounded-xl text-xs font-black shadow-lg shadow-black/20 uppercase tracking-wider transition active:scale-95"
            >
              <span>Order Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[#F7F1E5] hover:bg-[#123D2E] transition"
              title="Open Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#09291F] border-t border-[#1C5A40] px-4 py-4 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-[#F7F1E5]">
              <a
                href="#hero"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Home
              </a>
              <a
                href="#menu"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Artisan Menu
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Our Story
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Cafe Gallery
              </a>
              <a
                href="#hours"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Hours &amp; Location
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] hover:text-[#E6AD38]"
              >
                Contact &amp; Reservations
              </a>
              <Link
                href="/lookup"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#123D2E] text-[#E6AD38] flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Track Order Status
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* =========================================================================
          3. HERO SECTION (Full-width, Forest Green & Gold Luxury Direction)
          ========================================================================= */}
      <section id="hero" className="relative bg-[#09291F] text-[#F7F1E5] overflow-hidden border-b border-[#1C5A40]">
        {/* Subtle Decorative Ambient Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#123D2E] rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#E6AD38] rounded-full blur-3xl opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#123D2E] border border-[#E6AD38]/50 text-[#E6AD38] text-xs font-bold tracking-widest uppercase shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-[#E6AD38]" />
                <span>FRESHLY BAKED, MADE WITH LOVE</span>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tight text-white leading-tight">
                  Nordic Roast <br />
                  <span className="text-[#E6AD38] italic font-normal">&amp; Artisan Bakery</span>
                </h1>
                <p className="text-base sm:text-lg text-[#D6B36A] font-medium tracking-wide">
                  Where Slow Hearth Baking Meets Specialty Nordic Roasting
                </p>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-[#F7F1E5]/80 leading-relaxed max-w-2xl font-light">
                {cafe.description ||
                  'Savor single-origin specialty coffees, hand-pulled espresso, artisanal woodfired sourdough pizzas, and oven-fresh Viennoiserie crafted with Nordic passion and organic ingredients.'}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <a
                  href="#menu"
                  className="px-7 py-3.5 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] text-[#09291F] font-black text-sm rounded-xl shadow-xl shadow-black/30 transition uppercase tracking-wider flex items-center gap-2 active:scale-95"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Order Now</span>
                </a>
                <a
                  href="#about"
                  className="px-6 py-3.5 bg-[#123D2E] hover:bg-[#1C5A40] text-[#F7F1E5] font-bold text-sm rounded-xl border border-[#E6AD38]/40 transition flex items-center gap-2"
                >
                  <span>Our Story</span>
                  <ArrowRight className="w-4 h-4 text-[#E6AD38]" />
                </a>
              </div>

              {/* Features Strip */}
              <div className="pt-6 border-t border-[#1C5A40] grid grid-cols-3 gap-3 text-xs text-[#F7F1E5]/80">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#E6AD38] shrink-0" />
                  <span className="font-medium">Stone Hearth Oven</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#E6AD38] shrink-0" />
                  <span className="font-medium">100% Arabica Micro-Lots</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#E6AD38] shrink-0" />
                  <span className="font-medium">36hr Sourdough</span>
                </div>
              </div>
            </div>

            {/* Right Photography Column (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-[#123D2E] group">
                <img
                  src={
                    cafe.coverImage ||
                    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80'
                  }
                  alt="Nordic Roast & Bakery Interior"
                  className="w-full h-80 sm:h-96 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09291F] via-transparent to-transparent opacity-60" />

                {/* Floating Rating Badge */}
                <div className="absolute top-4 right-4 bg-[#09291F]/90 backdrop-blur-md border border-[#E6AD38]/40 px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-white">
                  <div className="flex items-center text-[#E6AD38]">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <span className="font-black text-xs font-mono">4.9 / 5.0</span>
                    <span className="block text-[9px] text-[#D6B36A]">1,400+ Reviews</span>
                  </div>
                </div>

                {/* Floating Operational Pill */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#09291F]/95 backdrop-blur-md border border-[#1C5A40] p-3.5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Open for Dine-In &amp; Takeaway
                      </span>
                      <span className="text-[11px] text-[#D6B36A] font-mono">
                        {cafe.todayHours || '8:00 AM – 11:00 PM Daily'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#E6AD38] uppercase tracking-wider bg-[#123D2E] px-2.5 py-1 rounded-lg border border-[#E6AD38]/30">
                    Live Kitchen
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MENU SEARCH & DIETARY FILTERS SECTION (#menu)
          ========================================================================= */}
      <section id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
        {/* Section Header */}
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#123D2E] bg-[#EFE5D2] px-3.5 py-1 rounded-full border border-[#E3D8C5]">
            Artisan Catalog
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#09291F]">
            Handcrafted Menu
          </h2>
          <p className="text-xs sm:text-sm text-[#563B2D] max-w-xl mx-auto font-light">
            Select items to order directly to your table or for takeaway. Every item is freshly prepared to order.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-[#EFE5D2] border border-[#E3D8C5] rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#123D2E]" />
            <input
              type="text"
              placeholder="Search our specialty coffees, stone-baked pizzas, sourdough melts, or pastries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white rounded-2xl border border-[#E3D8C5] text-[#09291F] text-sm focus:outline-none focus:border-[#123D2E] placeholder-[#887966] shadow-inner transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#887966] hover:text-[#09291F]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Dietary Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-4 py-2 rounded-xl transition whitespace-nowrap ${
                dietaryFilter === 'ALL'
                  ? 'bg-[#123D2E] text-white shadow-md'
                  : 'bg-white border border-[#E3D8C5] text-[#123D2E] hover:bg-[#F7F1E5]'
              }`}
            >
              All Dishes ({categories.reduce((acc, c) => acc + c.menuItems.length, 0)})
            </button>

            <button
              onClick={() => setDietaryFilter('VEG')}
              className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
                dietaryFilter === 'VEG'
                  ? 'bg-[#123D2E] text-white shadow-md'
                  : 'bg-white border border-[#E3D8C5] text-[#123D2E] hover:bg-[#F7F1E5]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Pure Veg</span>
            </button>

            <button
              onClick={() => setDietaryFilter('NON_VEG')}
              className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
                dietaryFilter === 'NON_VEG'
                  ? 'bg-[#123D2E] text-white shadow-md'
                  : 'bg-white border border-[#E3D8C5] text-[#123D2E] hover:bg-[#F7F1E5]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>Non-Veg</span>
            </button>

            <button
              onClick={() => setDietaryFilter('BESTSELLER')}
              className={`px-4 py-2 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                dietaryFilter === 'BESTSELLER'
                  ? 'bg-[#E6AD38] text-[#09291F] shadow-md'
                  : 'bg-white border border-[#E3D8C5] text-[#B45309] hover:bg-[#F7F1E5]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>★ Chef Bestsellers</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. STICKY HORIZONTAL CATEGORY NAVIGATION BAR
          ========================================================================= */}
      <div className="sticky top-20 z-30 bg-[#F7F1E5]/95 backdrop-blur-xl border-y border-[#E3D8C5] py-3 mt-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((c) => {
            const isActive = activeCategory === c.id;
            return (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-[#E6AD38] text-[#09291F] shadow-md shadow-[#E6AD38]/30 font-black scale-[1.02]'
                    : 'bg-[#EFE5D2] text-[#123D2E] hover:bg-[#E3D8C5] border border-[#E3D8C5]'
                }`}
              >
                {c.name}
              </a>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          6. FULL-SCREEN RESPONSIVE PRODUCT GRID (3-4 Columns Desktop)
          ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-16 pb-24">
        {categories.map((cat) => {
          const visibleItems = cat.menuItems.filter((item: any) => {
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

          if (visibleItems.length === 0) return null;

          return (
            <div key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36 space-y-6">
              {/* Category Header */}
              <div className="flex items-end justify-between border-b-2 border-[#123D2E]/20 pb-3">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#09291F]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#563B2D] mt-0.5 font-light">
                    Freshly crafted using Nordic culinary traditions
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#123D2E] bg-[#EFE5D2] px-3 py-1 rounded-full border border-[#E3D8C5]">
                  {visibleItems.length} {visibleItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* 3 to 4 Column Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleItems.map((item: any) => {
                  const itemCartQty = getItemCartQty(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenItem(item)}
                      className={`bg-white rounded-3xl border border-[#E3D8C5] shadow-sm hover:shadow-xl hover:shadow-[#123D2E]/10 transition-all duration-300 flex flex-col justify-between overflow-hidden group cursor-pointer active:scale-[0.99] ${
                        !item.isAvailable ? 'opacity-60 pointer-events-none' : ''
                      }`}
                    >
                      {/* Product Image with Badges */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFE5D2]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[#887966]">
                            <UtensilsCrossed className="w-8 h-8 mb-1 text-[#D6B36A]" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Artisan Dish
                            </span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          {/* Veg/Non-Veg Badge */}
                          <div
                            className={`w-4 h-4 rounded-md bg-white/95 backdrop-blur-md border flex items-center justify-center shadow-md ${
                              item.foodType === 'NON_VEG'
                                ? 'border-rose-600'
                                : item.foodType === 'EGG'
                                ? 'border-amber-600'
                                : 'border-emerald-600'
                            }`}
                            title={item.foodType}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.foodType === 'NON_VEG'
                                  ? 'bg-rose-600'
                                  : item.foodType === 'EGG'
                                  ? 'bg-amber-600'
                                  : 'bg-emerald-600'
                              }`}
                            />
                          </div>

                          {/* Bestseller Badge */}
                          {item.isBestseller && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E6AD38] text-[#09291F] shadow-md border border-[#D6B36A] flex items-center gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              <span>Bestseller</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-base sm:text-lg text-[#09291F] group-hover:text-[#123D2E] transition leading-snug line-clamp-1">
                            {item.name}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-[#563B2D] line-clamp-2 leading-relaxed font-light">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Price & Action Button Footer */}
                        <div className="pt-3 border-t border-[#E3D8C5]/60 flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-[#887966] font-medium">Price</span>
                            <span className="text-lg font-black text-[#123D2E] font-mono">
                              {formatCurrency(item.basePrice)}
                            </span>
                          </div>

                          {/* Add Button or Quantity Stepper */}
                          {item.isAvailable ? (
                            <div>
                              {itemCartQty > 0 ? (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center bg-[#123D2E] text-white rounded-xl shadow-md overflow-hidden"
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => handleDecrementItem(e, item)}
                                    className="w-8 h-8 flex items-center justify-center text-[#E6AD38] hover:bg-[#09291F] transition"
                                  >
                                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                  <span className="px-2 font-black text-xs text-white font-mono select-none">
                                    {itemCartQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleIncrementItem(e, item)}
                                    className="w-8 h-8 flex items-center justify-center text-[#E6AD38] hover:bg-[#09291F] transition"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrementItem(e, item)}
                                  className="px-4 py-2 bg-[#E6AD38] hover:bg-[#D6B36A] text-[#09291F] font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 uppercase tracking-wider font-mono active:scale-95"
                                >
                                  <span>Add</span>
                                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#887966] bg-[#EFE5D2] px-2.5 py-1 rounded-md">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* =========================================================================
          7. EDITORIAL "ABOUT OUR HEARTH & ROASTERY" SECTION (#about)
          ========================================================================= */}
      <section id="about" className="bg-[#EFE5D2] border-y border-[#E3D8C5] py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Story Text (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[#123D2E] bg-white px-3.5 py-1 rounded-full border border-[#E3D8C5]">
                Our Story &amp; Philosophy
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-[#09291F] leading-tight">
                Crafted by Time, <br />
                <span className="text-[#123D2E] italic font-normal">Hearth &amp; Season.</span>
              </h2>
              <p className="text-sm sm:text-base text-[#563B2D] leading-relaxed font-light">
                At Nordic Roast &amp; Bakery, we honor Scandinavian traditions of slow living and mindful gastronomy. Every single morning, our sourdough is folded by hand and allowed to ferment for 36 hours before kissing the stone deck of our hearth ovens.
              </p>
              <p className="text-sm sm:text-base text-[#563B2D] leading-relaxed font-light">
                Our green coffee beans are sourced directly from high-altitude micro-lots in Ethiopia, Colombia, and Chikmagalur. Roasted in small batches in our cast-iron roaster, we coax out delicate jasmine floral notes, velvety dark cocoa, and lingering sweet acidity.
              </p>

              {/* 3 Value Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E3D8C5] shadow-sm space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#123D2E]/10 flex items-center justify-center text-[#123D2E] mb-2">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-[#09291F]">36-Hour Sourdough</h4>
                  <p className="text-xs text-[#887966]">Slow cold fermentation for gut-friendly digestibility.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E3D8C5] shadow-sm space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#123D2E]/10 flex items-center justify-center text-[#123D2E] mb-2">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-[#09291F]">Micro-Lot Arabica</h4>
                  <p className="text-xs text-[#887966]">Ethically sourced, precision small-batch roasts.</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-[#E3D8C5] shadow-sm space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#123D2E]/10 flex items-center justify-center text-[#123D2E] mb-2">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-[#09291F]">Pure &amp; Natural</h4>
                  <p className="text-xs text-[#887966]">Zero chemical preservatives, additives, or shortcuts.</p>
                </div>
              </div>
            </div>

            {/* Collage Images (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
                alt="Fresh butter croissants"
                className="w-full h-56 object-cover rounded-3xl shadow-lg border-2 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80"
                alt="Pour over specialty brew"
                className="w-full h-56 object-cover rounded-3xl shadow-lg border-2 border-white mt-6"
              />
              <img
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
                alt="Artisan woodfired pizza"
                className="w-full h-56 object-cover rounded-3xl shadow-lg border-2 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80"
                alt="Barista pouring latte art"
                className="w-full h-56 object-cover rounded-3xl shadow-lg border-2 border-white mt-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CAFE GALLERY SECTION (#gallery)
          ========================================================================= */}
      <section id="gallery" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#123D2E] bg-[#EFE5D2] px-3.5 py-1 rounded-full border border-[#E3D8C5]">
            Atmosphere &amp; Moments
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-[#09291F]">
            The Nordic Experience
          </h2>
          <p className="text-xs sm:text-sm text-[#563B2D] max-w-lg mx-auto font-light">
            Warm Scandinavian interiors, cozy timber accents, and the irresistible aroma of roasted beans.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
              title: 'Espresso Bar & Counter',
            },
            {
              src: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=800&q=80',
              title: 'Cozy Dining Lounge',
            },
            {
              src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
              title: 'Fresh Daily Bakes',
            },
            {
              src: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
              title: 'Chemex Pour-Over Lab',
            },
            {
              src: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
              title: 'Woodfired Sourdough Pizza',
            },
            {
              src: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=800&q=80',
              title: 'Artisan Flat Whites',
            },
          ].map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-md group border border-[#E3D8C5]"
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09291F]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white font-serif font-bold text-sm tracking-wide">
                  {img.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          9. HOURS, LOCATION & CONTACT (#hours, #contact)
          ========================================================================= */}
      <section id="hours" className="bg-[#09291F] text-[#F7F1E5] py-16 sm:py-20 border-t border-[#1C5A40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hours */}
            <div className="bg-[#123D2E] p-6 sm:p-8 rounded-3xl border border-[#1C5A40] space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E6AD38]/20 flex items-center justify-center text-[#E6AD38]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Opening Hours</h3>
              <div className="space-y-2 text-xs sm:text-sm text-[#F7F1E5]/80 font-mono">
                <div className="flex justify-between border-b border-[#1C5A40] pb-2">
                  <span>Monday – Friday</span>
                  <span className="text-[#E6AD38] font-bold">8:00 AM – 11:00 PM</span>
                </div>
                <div className="flex justify-between border-b border-[#1C5A40] pb-2">
                  <span>Saturday – Sunday</span>
                  <span className="text-[#E6AD38] font-bold">7:30 AM – 11:30 PM</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Kitchen Closes</span>
                  <span className="text-[#D6B36A]">10:30 PM</span>
                </div>
              </div>
            </div>

            {/* Location & Map info */}
            <div className="bg-[#123D2E] p-6 sm:p-8 rounded-3xl border border-[#1C5A40] space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E6AD38]/20 flex items-center justify-center text-[#E6AD38]">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Cafe Location</h3>
              <p className="text-xs sm:text-sm text-[#F7F1E5]/80 leading-relaxed font-light">
                {cafe.branches?.[0]?.address || 'Sector 35-C, Inner Market, Chandigarh, Punjab 160022'}
              </p>
              <div className="pt-2 text-xs text-[#D6B36A] font-medium flex items-center gap-2">
                <span>Free parking available on premises</span>
              </div>
            </div>

            {/* Contact & Orders */}
            <div id="contact" className="bg-[#123D2E] p-6 sm:p-8 rounded-3xl border border-[#1C5A40] space-y-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E6AD38]/20 flex items-center justify-center text-[#E6AD38]">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Phone &amp; Inquiries</h3>
              <div className="space-y-2 text-xs sm:text-sm text-[#F7F1E5]/80">
                <p>
                  Direct Cafe Line:{' '}
                  <a
                    href={`tel:${cafe.branches?.[0]?.phone || '+919876543210'}`}
                    className="text-[#E6AD38] font-bold font-mono hover:underline"
                  >
                    {cafe.branches?.[0]?.phone || '+91 98765 43210'}
                  </a>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href="mailto:hello@nordicroast.com"
                    className="text-[#E6AD38] font-mono hover:underline"
                  >
                    hello@nordicroast.com
                  </a>
                </p>
                <div className="pt-2">
                  <a
                    href="#menu"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E6AD38] text-[#09291F] font-black text-xs rounded-xl shadow-md uppercase tracking-wider"
                  >
                    <span>Instant Digital Ordering</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FOOTER (Deep Forest Green & Champagne Gold)
          ========================================================================= */}
      <footer className="bg-[#09291F] text-[#F7F1E5] border-t border-[#1C5A40] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#123D2E] border border-[#E6AD38]/40 flex items-center justify-center text-[#E6AD38]">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif font-black text-lg text-white">
                Nordic Roast <span className="text-[#E6AD38]">&amp; Bakery</span>
              </span>
              <p className="text-[10px] text-[#D6B36A]">
                © {new Date().getFullYear()} Nordic Roast &amp; Bakery. All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#F7F1E5]/70">
            <a href="#hero" className="hover:text-[#E6AD38] transition">
              Back to Top
            </a>
            <a href="#menu" className="hover:text-[#E6AD38] transition">
              Menu
            </a>
            <a href="#about" className="hover:text-[#E6AD38] transition">
              Our Story
            </a>
            <Link href="/lookup" className="hover:text-[#E6AD38] transition text-[#E6AD38]">
              Track Order
            </Link>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          11. PRODUCT CUSTOMIZATION MODAL (White/Ivory & Forest Green)
          ========================================================================= */}
      {customizingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-[#FDFBF7] border border-[#E3D8C5] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col justify-between text-[#09291F]">
            {/* Modal Image & Header */}
            <div>
              <div className="relative">
                {customizingItem.image && (
                  <img
                    src={customizingItem.image}
                    alt={customizingItem.name}
                    className="w-full h-52 sm:h-56 object-cover"
                  />
                )}
                <button
                  onClick={() => setCustomizingItem(null)}
                  className="absolute top-3 right-3 p-2 bg-[#09291F]/80 backdrop-blur-md text-white hover:bg-[#09291F] rounded-full shadow-md transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-serif font-black text-[#09291F]">
                      {customizingItem.name}
                    </h2>
                    <span className="text-lg font-black text-[#123D2E] font-mono shrink-0">
                      {formatCurrency(
                        selectedVariant ? selectedVariant.price : customizingItem.basePrice
                      )}
                    </span>
                  </div>
                  {customizingItem.description && (
                    <p className="text-xs text-[#563B2D] mt-1.5 leading-relaxed font-light">
                      {customizingItem.description}
                    </p>
                  )}
                </div>

                {/* Variants Selection */}
                {customizingItem.variants && customizingItem.variants.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-[#E3D8C5]">
                    <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                      Choose Size / Option *
                    </label>
                    <div className="space-y-2">
                      {customizingItem.variants.map((v: any) => (
                        <label
                          key={v.id}
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs transition ${
                            selectedVariant?.id === v.id
                              ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold'
                              : 'border-[#E3D8C5] bg-white hover:bg-[#F7F1E5] text-[#563B2D]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="variant"
                              checked={selectedVariant?.id === v.id}
                              onChange={() => setSelectedVariant(v)}
                              className="text-[#123D2E] focus:ring-[#123D2E]"
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

                {/* Add-ons Checklist */}
                {customizingItem.menuItemAddonGroups &&
                  customizingItem.menuItemAddonGroups.length > 0 && (
                    <div className="space-y-4 pt-3 border-t border-[#E3D8C5]">
                      {customizingItem.menuItemAddonGroups.map((grp: any) => (
                        <div key={grp.addonGroup.id} className="space-y-2">
                          <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                            {grp.addonGroup.name} (Optional)
                          </label>
                          <div className="space-y-2">
                            {grp.addonGroup.options.map((opt: any) => {
                              const isChecked = selectedAddons.some((a) => a.id === opt.id);
                              return (
                                <label
                                  key={opt.id}
                                  className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer text-xs transition ${
                                    isChecked
                                      ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-semibold'
                                      : 'border-[#E3D8C5] bg-white hover:bg-[#F7F1E5] text-[#563B2D]'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleAddon(opt)}
                                      className="rounded text-[#123D2E] focus:ring-[#123D2E]"
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
                <div className="space-y-2 pt-3 border-t border-[#E3D8C5]">
                  <label className="text-xs font-bold text-[#123D2E] uppercase tracking-wider block font-mono">
                    Special Preparation Notes
                  </label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Extra hot oat milk on side, no ice, less sugar"
                    className="w-full px-3.5 py-2.5 text-xs border border-[#E3D8C5] bg-white text-[#09291F] placeholder-[#887966] rounded-xl focus:outline-none focus:border-[#123D2E]"
                  />
                </div>
              </div>
            </div>

            {/* Modal Bottom Stepper & Add Button */}
            <div className="p-4 sm:p-5 bg-[#EFE5D2] border-t border-[#E3D8C5] flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-white border border-[#E3D8C5] rounded-xl p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#123D2E] hover:bg-[#EFE5D2]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-extrabold text-sm text-[#09291F] font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#123D2E] hover:bg-[#EFE5D2]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3 bg-[#E6AD38] hover:bg-[#D6B36A] text-[#09291F] rounded-xl text-xs font-black shadow-md flex items-center justify-between px-5 transition active:scale-98 uppercase tracking-wider font-mono"
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
          12. BOTTOM FLOATING CART BAR (Forest Green & Gold)
          ========================================================================= */}
      {cart.length > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-5 inset-x-0 z-40 px-4 max-w-xl mx-auto animate-in slide-in-from-bottom-5 duration-300">
          <div
            onClick={() => setCartDrawerOpen(true)}
            className="flex items-center justify-between p-4 bg-[#09291F] text-[#F7F1E5] rounded-2xl shadow-2xl hover:bg-[#123D2E] transition-all group border border-[#1C5A40] cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E6AD38] text-[#09291F] flex items-center justify-center font-black text-sm font-mono shadow-md">
                {totalCartCount}
              </div>
              <div>
                <div className="font-bold text-sm text-white">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in your cart
                </div>
                <div className="text-xs text-[#D6B36A] font-mono">
                  Subtotal: <strong className="text-[#E6AD38]">{formatCurrency(totalCartSubtotal)}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-[#E6AD38] text-[#09291F] rounded-xl text-xs font-black uppercase tracking-wider group-hover:bg-[#D6B36A] transition">
              <span>View Cart</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          13. CART SLIDE-OVER DRAWER (Warm Ivory & Forest Green)
          ========================================================================= */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in">
          <div className="bg-[#F7F1E5] w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-[#E3D8C5] text-[#09291F] animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 bg-[#09291F] text-white flex items-center justify-between border-b border-[#1C5A40]">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-5 h-5 text-[#E6AD38]" />
                <h3 className="font-serif font-black text-lg">Your Cafe Cart</h3>
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
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-[#563B2D] space-y-3">
                  <ShoppingBag className="w-12 h-12 mx-auto text-[#D6B36A]" />
                  <p className="font-bold text-base text-[#09291F]">Your cart is currently empty</p>
                  <p className="text-xs">Browse our artisan coffees and hearth bakes above.</p>
                </div>
              ) : (
                cart.map((it) => (
                  <div
                    key={it.id}
                    className="bg-white p-3.5 rounded-2xl border border-[#E3D8C5] shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <h4 className="font-bold text-sm text-[#09291F]">{it.name}</h4>
                      {it.variant && (
                        <p className="text-[11px] text-[#123D2E] font-medium font-mono">
                          Size: {it.variant.name}
                        </p>
                      )}
                      {it.addons && it.addons.length > 0 && (
                        <p className="text-[10px] text-[#887966]">
                          Add-ons: {it.addons.map((a: any) => a.name).join(', ')}
                        </p>
                      )}
                      {it.specialInstructions && (
                        <p className="text-[10px] text-[#B45309] italic">
                          Note: "{it.specialInstructions}"
                        </p>
                      )}
                      <div className="text-xs font-black text-[#123D2E] font-mono pt-1">
                        {formatCurrency(it.itemTotalPrice)}
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 bg-[#EFE5D2] border border-[#E3D8C5] rounded-xl p-1">
                      <button
                        onClick={() => handleCartItemQuantityChange(it.id, -1)}
                        className="w-6 h-6 flex items-center justify-center text-[#123D2E] hover:bg-white rounded-lg transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">
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
              <div className="p-5 bg-white border-t border-[#E3D8C5] space-y-3">
                <div className="flex justify-between text-xs text-[#563B2D]">
                  <span>Item Subtotal</span>
                  <span className="font-mono font-bold text-[#09291F]">
                    {formatCurrency(totalCartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#563B2D]">
                  <span>Estimated Taxes (GST 5%)</span>
                  <span className="font-mono font-bold text-[#09291F]">
                    {formatCurrency(Math.round(totalCartSubtotal * 0.05))}
                  </span>
                </div>
                <div className="flex justify-between text-base font-serif font-black text-[#09291F] pt-2 border-t border-[#E3D8C5]">
                  <span>Estimated Total</span>
                  <span className="font-mono text-[#123D2E]">
                    {formatCurrency(Math.round(totalCartSubtotal * 1.05))}
                  </span>
                </div>

                <Link
                  href={`/c/${params.slug}/checkout${tableParam ? `?table=${tableParam}` : ''}`}
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full py-3.5 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] text-[#09291F] font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider font-mono transition active:scale-98"
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
}
