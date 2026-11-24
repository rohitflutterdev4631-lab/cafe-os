'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  Clock,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Trash2,
  Tag,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CartItem } from '@/types';
import { getStoredCart, saveStoredCart, clearStoredCart } from '@/lib/cartStore';

export default function CustomerCheckoutPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableParam = searchParams.get('table');

  const [cafe, setCafe] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>(
    tableParam ? 'DINE_IN' : 'DINE_IN'
  );
  const [tableNumber, setTableNumber] = useState(tableParam || 'T-01');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COUNTER' | 'CASH' | 'RAZORPAY' | 'UPI'>('COUNTER');

  useEffect(() => {
    const loadedCart = getStoredCart(params.slug);
    setCart(loadedCart);

    fetch(`/api/v1/public/c/${params.slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCafe(data.cafe);
        }
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  // Calculations reconciling cafe's actual tax rules
  const subtotal = cart.reduce((acc, it) => acc + it.itemTotalPrice, 0);

  let discount = 0;
  if (appliedCoupon === 'NORD10') {
    discount = Math.min(100, Math.round(subtotal * 0.1));
  }

  // Use actual cafe configured tax rate (e.g. 5.0% GST)
  const taxRate = cafe?.settings?.taxRatePercent ?? 5.0;
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * (taxRate / 100) * 100) / 100;
  const packagingFee =
    orderType === 'TAKEAWAY' || orderType === 'DELIVERY'
      ? cafe?.settings?.packagingFee || 20
      : 0;
  const totalAmount = Math.round((taxable + tax + packagingFee) * 100) / 100;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'NORD10') {
      setAppliedCoupon('NORD10');
      setCouponSuccess('10% discount applied successfully!');
    } else {
      setError('Invalid coupon code. Try NORD10 for 10% off.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleRemoveCartItem = (itemId: string) => {
    const updated = cart.filter((it) => it.id !== itemId);
    setCart(updated);
    saveStoredCart(params.slug, updated);
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your name and phone number for order tracking.');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      setError('Please enter your dining table number.');
      return;
    }

    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('Please provide a delivery address.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Send Order to API
      const res = await fetch(`/api/v1/public/c/${params.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress : null,
          notes,
          paymentMethod,
          items: cart.map((it) => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity,
            variantId: it.variant?.id || null,
            addonIds: it.addons.map((a: any) => a.addonId || a.id),
            specialInstructions: it.specialInstructions || null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      // 2. If Razorpay Online Payment selected:
      if (paymentMethod === 'RAZORPAY' && data.razorpay) {
        const isLoaded = await loadRazorpayScript();
        if (isLoaded) {
          const options: any = {
            key: data.razorpay.keyId,
            amount: data.razorpay.amount,
            currency: data.razorpay.currency || 'INR',
            name: cafe?.name || 'CAFE OS',
            description: `Order #${data.order.orderNumber}`,
            image: cafe?.logo || undefined,
            prefill: {
              name: customerName,
              contact: customerPhone,
              email: customerEmail || undefined,
            },
            theme: {
              color: '#D97706',
            },
            handler: async function (response: any) {
              setSubmitting(true);
              try {
                const verifyRes = await fetch('/api/v1/payments/razorpay/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: data.order.id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  }),
                });

                if (!verifyRes.ok) {
                  const vData = await verifyRes.json();
                  throw new Error(vData.error || 'Payment signature verification failed.');
                }

                clearStoredCart(params.slug);
                router.push(`/c/${params.slug}/orders/${data.order.orderNumber}`);
              } catch (vErr: any) {
                setError(vErr.message || 'Payment verification failed.');
                setSubmitting(false);
              }
            },
            modal: {
              ondismiss: function () {
                setSubmitting(false);
                setError('Payment modal was closed. You can retry or choose Pay at Counter.');
              },
            },
          };

          if (
            data.razorpay.orderId &&
            !data.razorpay.orderId.startsWith('order_test_') &&
            !data.razorpay.orderId.startsWith('order_mock_')
          ) {
            options.order_id = data.razorpay.orderId;
          }

          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (resp: any) {
            setSubmitting(false);
            setError(`Payment failed: ${resp.error?.description || 'Transaction declined'}`);
          });
          rzp.open();
          return;
        }
      }

      // Clear local cart
      clearStoredCart(params.slug);

      // Route to live order tracking page
      router.push(`/c/${params.slug}/orders/${data.order.orderNumber}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while placing your order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F1E5] flex flex-col items-center justify-center p-6 text-[#123D2E]">
        <div className="w-12 h-12 rounded-2xl bg-[#09291F] flex items-center justify-center text-[#E6AD38] shadow-lg mb-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#E6AD38]" />
        </div>
        <span className="text-xs font-serif font-bold uppercase tracking-wider text-[#09291F]">Preparing Secure Checkout...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#09291F] pb-24 font-sans selection:bg-[#E6AD38] selection:text-[#09291F]">
      {/* Checkout Top Bar */}
      <header className="bg-[#09291F] text-white sticky top-0 z-30 px-4 py-4 shadow-xl border-b border-[#1C5A40]">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/c/${params.slug}${tableParam ? `?table=${tableParam}` : ''}`}
            className="flex items-center gap-1.5 text-xs font-bold text-[#F7F1E5] hover:text-[#E6AD38] transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </Link>
          <span className="font-serif font-bold text-base text-white tracking-wide">
            {cafe?.name || 'Nordic Roast & Bakery'} • Secure Checkout
          </span>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: ORDER SUMMARY */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3D8C5] pb-3">
            <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              Your Order Items ({cart.length})
            </h2>
            <Link
              href={`/c/${params.slug}${tableParam ? `?table=${tableParam}` : ''}`}
              className="text-xs font-bold text-[#123D2E] hover:text-[#E6AD38] transition"
            >
              + Add more items
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="py-8 text-center text-[#563B2D] text-xs space-y-2">
              <p>Your cart is currently empty.</p>
              <Link
                href={`/c/${params.slug}`}
                className="inline-block text-[#123D2E] font-bold underline"
              >
                Browse Artisan Menu
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#E3D8C5]/60">
              {cart.map((item) => (
                <div key={item.id} className="py-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[#09291F] flex items-center gap-2">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      {item.variant && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#EFE5D2] text-[#123D2E] border border-[#E3D8C5]">
                          {item.variant.name}
                        </span>
                      )}
                    </div>

                    {item.addons && item.addons.length > 0 && (
                      <div className="text-[11px] text-[#563B2D] mt-0.5">
                        {item.addons.map((a) => `+ ${a.name}`).join(', ')}
                      </div>
                    )}

                    {item.specialInstructions && (
                      <div className="text-[11px] text-[#B45309] italic mt-0.5">
                        Note: {item.specialInstructions}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-sm text-[#123D2E] font-mono">
                      {formatCurrency(item.itemTotalPrice)}
                    </span>
                    <button
                      onClick={() => handleRemoveCartItem(item.id)}
                      className="text-[#887966] hover:text-rose-600 p-1 rounded-lg transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: ORDERING MODE */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
            <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
              2
            </span>
            Dining &amp; Service Mode
          </h2>

          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`p-3.5 rounded-2xl border text-center transition ${
                orderType === 'DINE_IN'
                  ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold shadow-sm'
                  : 'border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#563B2D]'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5 mx-auto mb-1 text-[#123D2E]" />
              <div className="text-xs font-bold leading-tight">Table Dine-In</div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('TAKEAWAY')}
              className={`p-3.5 rounded-2xl border text-center transition ${
                orderType === 'TAKEAWAY'
                  ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold shadow-sm'
                  : 'border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#563B2D]'
              }`}
            >
              <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-[#123D2E]" />
              <div className="text-xs font-bold leading-tight">Takeaway Pickup</div>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('DELIVERY')}
              className={`p-3.5 rounded-2xl border text-center transition ${
                orderType === 'DELIVERY'
                  ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold shadow-sm'
                  : 'border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#563B2D]'
              }`}
            >
              <MapPin className="w-5 h-5 mx-auto mb-1 text-[#123D2E]" />
              <div className="text-xs font-bold leading-tight">Local Delivery</div>
            </button>
          </div>

          {orderType === 'DINE_IN' && (
            <div className="pt-2 text-xs">
              <label className="font-bold text-[#123D2E] block uppercase tracking-wider mb-1 text-[11px] font-mono">
                Table Number / Location *
              </label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. 7 or Rooftop-01"
                className="w-full px-4 py-3 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-sm font-bold font-mono focus:border-[#123D2E] outline-none"
              />
            </div>
          )}
        </div>

        {/* SECTION 3: CUSTOMER INFORMATION */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
            <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
              3
            </span>
            Guest Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-[#123D2E] block uppercase tracking-wider mb-1 text-[11px] font-mono">
                Your Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="w-full px-4 py-3 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-sm focus:border-[#123D2E] outline-none placeholder-[#887966]"
              />
            </div>

            <div>
              <label className="font-bold text-[#123D2E] block uppercase tracking-wider mb-1 text-[11px] font-mono">
                Mobile Number (For Order Tracking) *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full px-4 py-3 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-sm font-mono focus:border-[#123D2E] outline-none placeholder-[#887966]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-[#123D2E] block uppercase tracking-wider mb-1 text-[11px] font-mono">
                Email Address (For Tax Invoice &amp; Receipt)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="ananya@example.com"
                className="w-full px-4 py-3 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-sm font-mono focus:border-[#123D2E] outline-none placeholder-[#887966]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DELIVERY INFORMATION */}
        {orderType === 'DELIVERY' && (
          <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4 animate-in fade-in">
            <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
              <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
                4
              </span>
              Delivery Address
            </h2>
            <div className="text-xs">
              <label className="font-bold text-[#123D2E] block uppercase tracking-wider mb-1 text-[11px] font-mono">
                Complete Street Address *
              </label>
              <textarea
                rows={2}
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="House / Flat #, Street, Landmark, Sector..."
                className="w-full px-4 py-3 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-sm focus:border-[#123D2E] outline-none placeholder-[#887966]"
              />
            </div>
          </div>
        )}

        {/* SECTION 5: PROMO CODE */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
            <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
              5
            </span>
            Promo Code / Bakery Voucher
          </h2>

          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter promo code (e.g. NORD10)"
              className="flex-1 px-4 py-2.5 border border-[#E3D8C5] bg-[#F7F1E5] text-[#09291F] rounded-xl text-xs uppercase font-mono font-bold focus:border-[#123D2E] outline-none placeholder-[#887966]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#123D2E] hover:bg-[#09291F] text-[#F7F1E5] rounded-xl text-xs font-bold transition shadow-sm uppercase tracking-wider"
            >
              Apply
            </button>
          </form>

          {couponSuccess && (
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" /> {couponSuccess}
            </p>
          )}
        </div>

        {/* SECTION 6: PRICE BREAKDOWN */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
            <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
              6
            </span>
            Price Breakdown &amp; Taxes
          </h2>

          <div className="space-y-2.5 text-xs text-[#563B2D]">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promo Discount ({appliedCoupon})</span>
                <span className="font-mono">-{formatCurrency(discount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Restaurant GST ({taxRate}%)</span>
              <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(tax)}</span>
            </div>

            {packagingFee > 0 && (
              <div className="flex justify-between">
                <span>Takeaway Packaging Fee</span>
                <span className="font-semibold text-[#09291F] font-mono">{formatCurrency(packagingFee)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#E3D8C5] flex justify-between items-baseline font-black text-base text-[#09291F]">
              <span>Grand Total Payable</span>
              <span className="text-xl text-[#123D2E] font-mono">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 7: PAYMENT METHOD */}
        <div className="bg-white rounded-3xl border border-[#E3D8C5] p-6 shadow-sm space-y-4">
          <h2 className="font-serif font-bold text-base text-[#09291F] flex items-center gap-2 border-b border-[#E3D8C5] pb-3">
            <span className="w-6 h-6 rounded-full bg-[#123D2E] text-[#E6AD38] text-xs font-bold flex items-center justify-center font-mono">
              7
            </span>
            Payment Mode
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label
              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                paymentMethod === 'COUNTER'
                  ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold shadow-sm'
                  : 'border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#563B2D]'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'COUNTER'}
                onChange={() => setPaymentMethod('COUNTER')}
                className="text-[#123D2E] focus:ring-[#123D2E]"
              />
              <div>
                <div className="font-bold text-sm text-[#09291F]">Pay at Counter</div>
                <div className="text-[11px] text-[#563B2D] font-normal">
                  Pay via cash, UPI or card after dining
                </div>
              </div>
            </label>

            <label
              className={`p-4 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
                paymentMethod === 'RAZORPAY'
                  ? 'border-[#123D2E] bg-[#123D2E]/10 text-[#09291F] font-bold shadow-sm'
                  : 'border-[#E3D8C5] hover:bg-[#F7F1E5] text-[#563B2D]'
              }`}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === 'RAZORPAY'}
                onChange={() => setPaymentMethod('RAZORPAY')}
                className="text-[#123D2E] focus:ring-[#123D2E]"
              />
              <div>
                <div className="font-bold text-sm text-[#09291F]">Online Payment (UPI &amp; Cards)</div>
                <div className="text-[11px] text-[#563B2D] font-normal">
                  Instant secure payment via Razorpay
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* SECTION 8: PLACE ORDER ACTION */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={submitting || cart.length === 0}
            className="w-full py-4 bg-gradient-to-r from-[#E6AD38] to-[#D6B36A] hover:from-[#D6B36A] hover:to-[#E6AD38] active:scale-98 text-[#09291F] rounded-2xl font-black text-sm shadow-xl transition flex items-center justify-between px-7 uppercase tracking-wider font-mono disabled:opacity-50"
          >
            <span>Confirm &amp; Place Order</span>
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="font-mono text-base">{formatCurrency(totalAmount)}</span>
            )}
          </button>
          <p className="text-center text-[11px] text-[#887966] mt-2.5 font-medium">
            Your ticket is sent instantly to Nordic Roast &amp; Bakery kitchen pass.
          </p>
        </div>
      </main>
    </div>
  );
}
