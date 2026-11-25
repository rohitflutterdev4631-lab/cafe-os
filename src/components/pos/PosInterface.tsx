'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Printer,
  X,
  Sparkles,
  Receipt,
  User,
  Coffee,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  Maximize2,
  Minimize2,
  LayoutDashboard,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface PosItem {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  foodType: string;
  image?: string | null;
  variants?: { id: string; name: string; price: number }[];
  addons?: { name: string; price: number }[];
}

export interface CartItem {
  cartId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  variantName?: string;
  notes?: string;
}

interface PosInterfaceProps {
  onClose?: () => void;
  initialTableNumber?: string;
  onOrderCreated?: (order: any) => void;
  asModal?: boolean;
}

export function PosInterface({
  onClose,
  initialTableNumber,
  onOrderCreated,
  asModal = false,
}: PosInterfaceProps) {
  const [menuItems, setMenuItems] = useState<PosItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['ALL', 'COFFEE', 'BEVERAGES', 'BAKERY', 'FOOD']);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState(initialTableNumber || '1');
  const [customerName, setCustomerName] = useState('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState('+91 98200 11223');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [heldOrders, setHeldOrders] = useState<{ id: string; time: string; cart: CartItem[]; table: string }[]>([]);
  const [mobilePosTab, setMobilePosTab] = useState<'MENU' | 'CART'>('MENU');

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Variant selector modal
  const [selectedItemForVariant, setSelectedItemForVariant] = useState<PosItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);

  // Fullscreen Kiosk State
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    // Instant zero-latency paint from cache on reloads
    try {
      const cached = sessionStorage.getItem('pos_menu_items_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuItems(parsed);
          const cats: string[] = Array.from(new Set<string>(parsed.map((i: any) => (i.category?.name as string) || 'COFFEE')));
          setCategories(['ALL', ...cats]);
        }
      }
    } catch {}

    // Fetch live menu items and refresh cache
    fetch('/api/v1/menu-items')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setMenuItems(data.items);
          const cats: string[] = Array.from(new Set<string>(data.items.map((i: any) => (i.category?.name as string) || 'COFFEE')));
          setCategories(['ALL', ...cats]);
          try {
            sessionStorage.setItem('pos_menu_items_cache', JSON.stringify(data.items));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'ALL' || (item as any).category?.name === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addItemToCart = (item: PosItem, variant?: { name: string; price: number }) => {
    const price = variant ? variant.price : item.basePrice;
    const cartId = `${item.id}-${variant ? variant.name : 'def'}`;
    const existing = cart.find((c) => c.cartId === cartId);

    if (existing) {
      setCart(cart.map((c) => (c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          cartId,
          menuItemId: item.id,
          name: item.name,
          price,
          quantity: 1,
          variantName: variant?.name,
        },
      ]);
    }
    setSelectedItemForVariant(null);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.cartId === cartId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((acc, c) => acc + c.price * c.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = Math.max(0, Math.round((subtotal + tax - discountAmount) * 100) / 100);

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'VIP20') {
      const disc = Math.round(subtotal * 0.2);
      setDiscountAmount(disc);
    } else if (couponCode.toUpperCase() === 'WELCOME50') {
      setDiscountAmount(50);
    } else {
      alert('Invalid coupon code. Try VIP20 or WELCOME50');
    }
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders([
      ...heldOrders,
      {
        id: `HOLD-${Date.now().toString().slice(-4)}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cart: [...cart],
        table: tableNumber,
      },
    ]);
    setCart([]);
  };

  const handleResumeOrder = (held: any) => {
    setCart(held.cart);
    setTableNumber(held.table);
    setHeldOrders(heldOrders.filter((h) => h.id !== held.id));
  };

  const handleCompleteOrder = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          customerName,
          customerPhone,
          items: cart,
          paymentMethod,
          discountAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCompletedOrder(data.order);
        setCart([]);
        if (onOrderCreated) onOrderCreated(data.order);
      } else {
        alert(data.error || 'Failed to complete order');
      }
    } catch (e: any) {
      alert(e.message || 'Error completing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const terminalContent = (
    <div
      className={`flex flex-col overflow-hidden text-stone-100 ${
        asModal
          ? 'bg-stone-900 border border-stone-800 rounded-2xl sm:rounded-3xl w-full max-w-7xl h-[94vh] shadow-2xl animate-in zoom-in-95 duration-200'
          : 'w-full h-full flex-1 min-h-0 bg-stone-950'
      }`}
    >
      {/* Top Header Bar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-stone-800 flex items-center justify-between bg-stone-900/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-600/30 shrink-0">
            <Coffee className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-extrabold text-sm sm:text-base lg:text-lg tracking-tight text-white whitespace-nowrap">
                CAFE OS POS
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap hidden xs:inline">
                Register #01 • Online
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-stone-400 hidden sm:block">
              High-speed register & kitchen dispatch terminal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile Tab Toggle Switch */}
          <div className="flex lg:hidden items-center bg-stone-800/80 p-0.5 rounded-xl border border-stone-700/60">
            <button
              onClick={() => setMobilePosTab('MENU')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mobilePosTab === 'MENU' ? 'bg-amber-600 text-white shadow' : 'text-stone-400'
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setMobilePosTab('CART')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mobilePosTab === 'CART' ? 'bg-amber-600 text-white shadow' : 'text-stone-400'
              }`}
            >
              Cart
              {cart.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-stone-950 text-[10px] flex items-center justify-center font-bold">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {heldOrders.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-amber-400 font-semibold">Held ({heldOrders.length}):</span>
              {heldOrders.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleResumeOrder(h)}
                  className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs hover:bg-amber-500/30 transition"
                >
                  T{h.table} ({h.time})
                </button>
              ))}
            </div>
          )}

          {/* Fullscreen Kiosk toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Kiosk Fullscreen' : 'Enter Kiosk Fullscreen'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60 text-xs font-medium transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Kiosk' : 'Kiosk Mode'}</span>
          </button>

          {/* Close button if modal, or Return to 3D Cockpit if screen page */}
          {asModal && onClose ? (
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400 hover:text-white transition"
              title="Close POS Modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700/60 text-xs font-medium transition"
              title="Return to 3D Cockpit"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">3D HQ</span>
            </button>
          ) : null}
        </div>
      </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Menu Browser (65% on Desktop, Full on Mobile) */}
          <div className={`flex-1 flex flex-col border-r border-stone-800 bg-stone-900/50 ${mobilePosTab === 'CART' ? 'hidden lg:flex' : 'flex'}`}>
            {/* Search and Category Filters */}
            <div className="p-3 sm:p-4 border-b border-stone-800 space-y-2.5 sm:space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 sm:top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Quick search dishes or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-1.5 sm:py-2 bg-stone-800/80 border border-stone-700 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                        : 'bg-stone-800/70 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.variants && item.variants.length > 0) {
                      setSelectedItemForVariant(item);
                      setSelectedVariant(item.variants[0]);
                    } else {
                      addItemToCart(item);
                    }
                  }}
                  className="bg-stone-800/60 border border-stone-700/60 hover:border-amber-500/60 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer hover:bg-stone-800 transition duration-150 group shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1 sm:mb-1.5">
                      <span className="font-bold text-xs sm:text-sm text-stone-100 group-hover:text-amber-400 transition leading-snug">
                        {item.name}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${
                          item.foodType === 'VEG' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-stone-400 line-clamp-2">
                      {(item as any).description || 'Artisanal cafe creation'}
                    </span>
                  </div>

                  <div className="mt-2.5 sm:mt-3 flex items-center justify-between pt-2 border-t border-stone-700/40">
                    <span className="font-extrabold text-xs sm:text-sm text-stone-200">
                      ₹{item.basePrice}
                    </span>
                    <button className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-600/20 text-amber-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile View Order Floating Bar */}
            {cart.length > 0 && (
              <div className="lg:hidden p-3 border-t border-stone-800 bg-stone-950/95 sticky bottom-0 z-20">
                <button
                  onClick={() => setMobilePosTab('CART')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>View Ticket ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</span>
                  </span>
                  <span className="font-mono text-sm font-black">₹{grandTotal} →</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Active Cart & Register (35% on Desktop, Full on Mobile) */}
          <div className={`w-full lg:w-96 flex flex-col bg-stone-950/80 ${mobilePosTab === 'MENU' ? 'hidden lg:flex' : 'flex'}`}>
            {/* Mobile Back Button to Dish Menu */}
            <div className="lg:hidden px-4 pt-3 pb-2 border-b border-stone-800 flex items-center justify-between bg-stone-900/40">
              <button
                onClick={() => setMobilePosTab('MENU')}
                className="flex items-center gap-1.5 text-xs text-amber-400 font-extrabold hover:text-amber-300"
              >
                ← Back to Menu Catalog
              </button>
              <span className="text-[11px] text-stone-400 font-mono">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items in ticket
              </span>
            </div>
            {/* Order Configuration Bar */}
            <div className="p-4 border-b border-stone-800 space-y-3">
              <div className="grid grid-cols-3 gap-1 bg-stone-900 p-1 rounded-xl">
                {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition ${
                      orderType === type
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {orderType === 'DINE_IN' && (
                <div className="flex items-center justify-between text-xs bg-stone-900/60 p-2.5 rounded-xl border border-stone-800">
                  <span className="text-stone-400">Assigned Table:</span>
                  <div className="flex items-center gap-1.5">
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTableNumber(t)}
                        className={`w-6 h-6 rounded-md text-xs font-bold ${
                          tableNumber === t
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guest Details */}
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-stone-500" /> {customerName}
                </span>
                <span className="font-mono text-stone-500">{customerPhone}</span>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-2">
                  <ShoppingCart className="w-10 h-10 opacity-30" />
                  <p className="text-xs">Cart is currently empty.</p>
                  <p className="text-[11px] text-stone-600">Select items from the catalog to ring up.</p>
                </div>
              ) : (
                cart.map((c) => (
                  <div
                    key={c.cartId}
                    className="bg-stone-900/90 border border-stone-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-stone-100 truncate">{c.name}</div>
                      {c.variantName && (
                        <div className="text-[10px] text-amber-400 font-medium">{c.variantName}</div>
                      )}
                      <div className="text-xs font-extrabold text-stone-300 mt-0.5">
                        ₹{c.price * c.quantity}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 bg-stone-800 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(c.cartId, -1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-700 text-stone-300"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-stone-100">
                        {c.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(c.cartId, 1)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-700 text-stone-300"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Billing Footer */}
            <div className="p-4 border-t border-stone-800 bg-stone-950 space-y-3">
              {/* Discount / Coupon Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Coupon (e.g. VIP20)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-lg text-xs uppercase text-stone-200 placeholder-stone-600 focus:outline-none"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded-lg transition"
                >
                  Apply
                </button>
              </div>

              {/* Tally */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-stone-400">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-1.5 border-t border-stone-800">
                  <span>Grand Total</span>
                  <span className="text-amber-400">₹{grandTotal}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleHoldOrder}
                  disabled={cart.length === 0}
                  className="py-2.5 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 font-bold rounded-xl text-xs transition"
                >
                  Hold Order
                </button>
                <button
                  onClick={() => {
                    setCashTendered(grandTotal);
                    setShowPaymentModal(true);
                  }}
                  disabled={cart.length === 0}
                  className="py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-1.5"
                >
                  <Banknote className="w-4 h-4" /> Pay ₹{grandTotal}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  return (
    <>
      {asModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
          {terminalContent}
        </div>
      ) : (
        <div className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden bg-stone-950">
          {terminalContent}
        </div>
      )}

      {/* Payment Checkout Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl text-stone-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="font-extrabold text-lg text-white">Settle Bill • ₹{grandTotal}</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-3 rounded-2xl flex flex-col items-center gap-1.5 border transition ${
                      paymentMethod === m.id
                        ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-stone-800/70 border-stone-700 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tendered Calculator */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Cash Received:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="w-24 px-2 py-1 bg-stone-800 border border-stone-700 rounded-lg text-right font-mono text-sm text-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  {[100, 200, 500, 1000, 2000].map((denom) => (
                    <button
                      key={denom}
                      onClick={() => setCashTendered(denom)}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 rounded text-[11px] font-mono text-stone-300"
                    >
                      +₹{denom}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-stone-800 font-bold">
                  <span className="text-stone-300">Change Due:</span>
                  <span className="font-mono text-emerald-400 text-sm">
                    ₹{Math.max(0, cashTendered - grandTotal)}
                  </span>
                </div>
              </div>
            )}

            {/* UPI QR Code Preview */}
            {paymentMethod === 'UPI' && (
              <div className="flex flex-col items-center justify-center p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                <div className="w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center">
                  <div className="w-full h-full border-2 border-dashed border-stone-400 flex items-center justify-center text-stone-900 font-mono text-[10px] text-center">
                    UPI SCAN & PAY
                    <br />
                    ₹{grandTotal}
                  </div>
                </div>
                <span className="text-[11px] text-stone-400">Scan via GPay, PhonePe, or Paytm</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCompleteOrder}
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Authorizing Order...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" /> Confirm & Dispatch to Kitchen
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Completed Order Success & Receipt Modal */}
      {completedOrder && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-stone-100 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-extrabold text-xl text-white">Order Confirmed!</h3>
              <p className="text-xs text-stone-400 mt-1">
                Order #{completedOrder.orderNumber} sent to Kitchen KDS.
              </p>
            </div>

            <div
              id="printable-receipt"
              className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-left text-xs font-mono space-y-2"
            >
              <div className="text-center font-bold text-sm text-white">NORDIC ROAST & BAKERY</div>
              <div className="text-center text-[10px] text-stone-400">
                Ticket: {completedOrder.orderNumber} • Table {completedOrder.tableNumber || 'Takeaway'}
              </div>
              <div className="border-t border-dashed border-stone-800 pt-2 space-y-1">
                {completedOrder.items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.itemName}
                    </span>
                    <span>₹{it.subtotalPrice}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-stone-800 pt-2 flex justify-between font-bold text-amber-400">
                <span>TOTAL PAID</span>
                <span>₹{completedOrder.totalAmount}</span>
              </div>
              <div className="text-center text-[10px] text-stone-500 pt-1">
                Payment: {completedOrder.paymentMethod} • GSTIN 27AABCU9603R1ZM
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Thermal KOT
              </button>
              <button
                onClick={() => {
                  setCompletedOrder(null);
                  setShowPaymentModal(false);
                }}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition"
              >
                Next Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
