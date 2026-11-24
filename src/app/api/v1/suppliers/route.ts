import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { cafeId },
      include: {
        _count: {
          select: { inventoryItems: true, purchaseOrders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'CAFE_OWNER', 'CAFE_MANAGER']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const body = await req.json();
    const { name, contactPerson, email, phone, address, categories, paymentTerms, rating } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Supplier name required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        cafeId,
        name,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        categories: categories || null,
        paymentTerms: paymentTerms || 'NET_30',
        rating: rating ? Number(rating) : 5.0,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
