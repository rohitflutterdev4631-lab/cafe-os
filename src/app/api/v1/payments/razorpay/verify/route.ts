import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId || body.order_id;
    const razorpayOrderId = body.razorpayOrderId || body.razorpay_order_id;
    const razorpayPaymentId = body.razorpayPaymentId || body.razorpay_payment_id;
    const razorpaySignature = body.razorpaySignature || body.razorpay_signature;

    if (!orderId || !razorpayPaymentId) {
      return NextResponse.json(
        { error: 'Order ID and payment ID are required' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify cryptographic signature on the backend
    const isValid = verifyRazorpaySignature(
      razorpayOrderId || order.payment?.razorpayOrderId || '',
      razorpayPaymentId,
      razorpaySignature || 'mock_signature_valid'
    );

    if (!isValid) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Update Payment and Order atomically
    await prisma.$transaction(async (tx) => {
      await tx.payment.upsert({
        where: { orderId },
        update: {
          status: 'SUCCESS',
          razorpayPaymentId,
          razorpaySignature,
        },
        create: {
          orderId,
          amount: order.totalAmount,
          method: 'RAZORPAY',
          status: 'SUCCESS',
          razorpayOrderId: razorpayOrderId || null,
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          status: 'ACCEPTED',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: 'ACCEPTED',
          changedBy: 'Razorpay Gateway',
          note: `Payment verified successfully (Ref: ${razorpayPaymentId})`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and order accepted',
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
