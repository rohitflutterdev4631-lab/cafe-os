'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RazorpayTestPaymentPage() {
  const [amountRupees, setAmountRupees] = useState(10);
  const [customerName, setCustomerName] = useState('Test Customer');
  const [customerEmail, setCustomerEmail] = useState('test@nordcafe.com');
  const [customerPhone, setCustomerPhone] = useState('9876543210');

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'IDLE' | 'CREATING_ORDER' | 'AWAITING_PAYMENT' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
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

  const handleStartCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPaymentDetails(null);
    setLogs([]);
    setLoading(true);

    try {
      addLog('Step 1: Calling Backend POST /api/create-order...');
      setStep('CREATING_ORDER');

      const amountInPaise = Math.round(amountRupees * 100);

      // 1. Call Backend to create order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInPaise,
          amountInPaise,
          currency: 'INR',
          receipt: `test_rcpt_${Date.now()}`,
          notes: {
            customer_name: customerName,
            customer_phone: customerPhone,
            platform: 'Nord Cafe Razorpay Standard Checkout Test',
          },
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.error || `Server returned status ${res.status}`);
      }

      const orderId = orderData.order_id || orderData.id;
      addLog(`✓ Razorpay Order Created: ${orderId} (${formatCurrency(amountRupees)})`);

      // 2. Load script
      addLog('Step 2: Loading Razorpay SDK (checkout.js)...');
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout.js script');
      }
      addLog('✓ Razorpay checkout.js ready. Opening payment modal...');
      setStep('AWAITING_PAYMENT');

      let keyId = orderData.key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U2KYtEI7v8825p';
      if (keyId === 'rzp_test_U2KY0oQlYOVlgB' || !keyId.startsWith('rzp_')) {
        keyId = 'rzp_test_U2KYtEI7v8825p';
      }

      // 3. Configure Razorpay Standard Modal
      const options: any = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Nord Cafe Platform',
        description: `Test Payment for ${formatCurrency(amountRupees)}`,
        image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200&q=80',
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone,
        },
        theme: {
          color: '#2563EB',
        },
      };

      if (orderId && !orderId.startsWith('order_test_') && !orderId.startsWith('order_mock_')) {
        options.order_id = orderId;
      }

      options.handler = async function (response: any) {
          addLog('✓ Payment completed in modal! Received signature.');
          addLog(`  • Payment ID: ${response.razorpay_payment_id}`);
          addLog(`  • Order ID: ${response.razorpay_order_id}`);
          addLog(`  • Signature: ${response.razorpay_signature?.substring(0, 16)}...`);

          setStep('VERIFYING');
          addLog('Step 3: Verifying HMAC-SHA256 signature with /api/verify-payment...');

          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              throw new Error(verifyData.error || 'Signature verification failed');
            }

            addLog('🎉 SUCCESS! Cryptographic signature verified.');
            setStep('SUCCESS');
            setPaymentDetails({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              amount: amountRupees,
              verifiedAt: verifyData.verified_at,
            });
          } catch (vErr: any) {
            setErrorMsg(vErr.message);
            setStep('FAILED');
            addLog(`✗ Verification failed: ${vErr.message}`);
          } finally {
            setLoading(false);
          }
        };

        options.modal = {
          ondismiss: function () {
            setLoading(false);
            setStep('FAILED');
            setErrorMsg('Payment modal was closed by user without completing transaction.');
            addLog('⚠️ User dismissed Razorpay checkout modal.');
          },
        };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', function (resp: any) {
        setLoading(false);
        setStep('FAILED');
        const desc = resp.error?.description || 'Payment rejected by gateway';
        setErrorMsg(`Payment Failed: ${desc}`);
        addLog(`✗ Gateway Error: ${desc}`);
      });

      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setStep('FAILED');
      setErrorMsg(err.message || 'Checkout initiation failed');
      addLog(`✗ Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1"
            >
              ← Return Home
            </Link>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              Razorpay Standard Checkout
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Razorpay Standard Web Checkout
              </h1>
              <p className="text-xs text-slate-500">
                End-to-end integration: Order Creation $\rightarrow$ Standard Modal $\rightarrow$ HMAC-SHA256 Signature Verification.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Payment Simulator
          </h2>

          <form onSubmit={handleStartCheckout} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="100000"
                    required
                    value={amountRupees}
                    onChange={(e) => setAmountRupees(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Minimum: ₹1.00 (100 paise)
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {formatCurrency(amountRupees)} via Razorpay Standard Modal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Success Box */}
          {step === 'SUCCESS' && paymentDetails && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Payment & Signature Verified!</span>
              </div>
              <div className="text-xs space-y-1 font-mono pl-7">
                <div>Payment ID: <strong>{paymentDetails.paymentId}</strong></div>
                <div>Order ID: <strong>{paymentDetails.orderId}</strong></div>
                <div>Amount Settled: <strong>{formatCurrency(paymentDetails.amount)}</strong></div>
                <div>Verified At: <strong>{paymentDetails.verifiedAt}</strong></div>
              </div>
            </div>
          )}

          {/* Error Box */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Transaction Notice:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Event Execution Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-3xl p-5 text-white font-mono text-xs space-y-2 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                Execution Telemetry Logs
              </span>
              <span className="text-emerald-400 text-[10px] animate-pulse">● Live</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
