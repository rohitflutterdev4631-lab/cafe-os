import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const cafeIdParam = searchParams.get('cafeId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    // Tenant Scoping
    const whereClause: any = {};

    if (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') {
      if (!session.cafeId) {
        return NextResponse.json({ error: 'User does not belong to a cafe' }, { status: 400 });
      }
      whereClause.cafeId = session.cafeId;
    } else if (cafeIdParam) {
      whereClause.cafeId = cafeIdParam;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    const [imports, total] = await Promise.all([
      prisma.menuImport.findMany({
        where: whereClause,
        include: {
          cafe: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
          files: {
            select: {
              id: true,
              originalFilename: true,
              fileSize: true,
              mimeType: true,
              pageCount: true,
              processingStatus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.menuImport.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: imports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('List imports error:', error);
    return NextResponse.json({ error: 'Failed to retrieve menu imports' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const body = await req.json();
    const { cafeId: requestedCafeId, branchId, menuName, notes, language } = body;

    // Determine target cafe
    let targetCafeId = session.cafeId;
    if (session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_STAFF') {
      targetCafeId = requestedCafeId || session.cafeId;
    }

    if (!targetCafeId) {
      return NextResponse.json({ error: 'Target cafe ID is required' }, { status: 400 });
    }

    // Verify cafe exists
    const cafe = await prisma.cafe.findUnique({
      where: { id: targetCafeId },
      include: { settings: true },
    });

    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }

    const defaultCurrency = cafe.settings?.currency || 'INR';

    const menuImport = await prisma.menuImport.create({
      data: {
        cafeId: targetCafeId,
        branchId: branchId || null,
        uploadedBy: session.userId,
        menuName: menuName?.trim() || `Menu Import — ${new Date().toLocaleDateString()}`,
        status: 'PENDING',
        currency: defaultCurrency,
        notes: notes || null,
        language: language || 'en',
      },
    });

    // Audit log
    await prisma.menuImportAuditLog.create({
      data: {
        importId: menuImport.id,
        userId: session.userId,
        action: 'CREATED',
        metadata: JSON.stringify({
          cafeId: targetCafeId,
          branchId,
          menuName: menuImport.menuName,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: menuImport,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Create import error:', error);
    return NextResponse.json({ error: 'Failed to create menu import session' }, { status: 500 });
  }
}
