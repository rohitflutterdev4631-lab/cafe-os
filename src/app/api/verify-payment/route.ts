import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getActiveRazorpayCredentials } from '@/lib/razorpay';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    const orderId = razorpay_order_id || order_id;
    const paymentId = razorpay_payment_id;
    const signature = razorpay_signature;

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: order_id, razorpay_payment_id, and razorpay_signature are required',
        },
        { status: 400 }
      );
    }

    const { keySecret } = getActiveRazorpayCredentials();
    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay Key Secret is not configured on server' },
        { status: 500 }
      );
    }

    // Step 3: Algorithm HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    // Safe comparison
    let isMatch = false;
    try {
      const a = Buffer.from(generatedSignature, 'utf8');
      const b = Buffer.from(signature, 'utf8');
      if (a.length === b.length) {
        isMatch = crypto.timingSafeEqual(a, b);
      }
    } catch {
      isMatch = generatedSignature === signature;
    }

    // Allow mock/test signature fallback if testing in demo mode
    if (!isMatch && (keySecret.includes('demo') || keySecret === 'rzp_test_secret_nordcafe') && signature === 'mock_signature_valid') {
      isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Signature verification failed. Payment cannot be marked as verified.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
      verified_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/verify-payment:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal server error verifying signature' },
      { status: 500 }
    );
  }
}
