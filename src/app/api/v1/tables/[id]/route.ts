import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'KITCHEN_STAFF', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const existing = await prisma.diningTable.findUnique({
      where: { id: params.id },
    });

    if (!existing || (existing.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Table not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();

    const updated = await prisma.diningTable.update({
      where: { id: params.id },
      data: {
        ...(body.tableNumber && { tableNumber: body.tableNumber }),
        ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
        ...(body.status && { status: body.status }),
      },
      include: { qrCode: true },
    });

    return NextResponse.json({ success: true, table: updated });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    const existing = await prisma.diningTable.findUnique({
      where: { id: params.id },
    });

    if (!existing || (existing.cafeId !== cafeId && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Table not found or unauthorized' }, { status: 404 });
    }

    await prisma.diningTable.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Table deleted' });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
