import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { publishImportedMenu } from '@/lib/importer/publisher';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
      'CAFE_MANAGER',
    ]);

    const importSession = await prisma.menuImport.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!importSession) {
      return NextResponse.json({ error: 'Import session not found' }, { status: 404 });
    }

    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importSession.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (importSession.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This menu import has already been published' },
        { status: 400 }
      );
    }

    if (importSession.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Menu extraction must be completed before publishing' },
        { status: 400 }
      );
    }

    // Publish in a single atomic database transaction
    const result = await publishImportedMenu(params.id, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Menu successfully published to live digital cafe menu!',
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Publish import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish menu' }, { status: 500 });
  }
}
