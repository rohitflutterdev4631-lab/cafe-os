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

    const [equipmentList, checklists] = await Promise.all([
      prisma.equipment.findMany({
        where: { cafeId },
        include: {
          maintenanceLogs: {
            orderBy: { serviceDate: 'desc' },
            take: 3,
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.foodSafetyChecklist.findMany({
        where: { cafeId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({ success: true, equipment: equipmentList, checklists });
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
    const { action = 'EQUIPMENT', name, model, serialNumber, category, notes, checklistType, title, items } = body;

    if (action === 'CHECKLIST') {
      const checklist = await prisma.foodSafetyChecklist.create({
        data: {
          cafeId,
          type: checklistType || 'OPENING',
          title: title || 'Daily Checklist',
          itemsJson: JSON.stringify(items || []),
          completedBy: session.name,
          status: 'COMPLETED',
          date: new Date().toISOString().split('T')[0],
        },
      });
      return NextResponse.json({ success: true, checklist });
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'Equipment name required' }, { status: 400 });
    }

    const equipment = await prisma.equipment.create({
      data: {
        cafeId,
        name,
        model: model || null,
        serialNumber: serialNumber || null,
        category: category || 'ESPRESSO_MACHINE',
        notes: notes || null,
        status: 'OPERATIONAL',
      },
    });

    return NextResponse.json({ success: true, equipment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
