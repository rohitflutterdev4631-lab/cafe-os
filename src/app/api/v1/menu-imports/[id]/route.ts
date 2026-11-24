import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { deleteImportFiles } from '@/lib/importer/storage';

export const dynamic = 'force-dynamic';

export async function GET(
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
        cafe: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        files: true,
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!importSession) {
      return NextResponse.json({ error: 'Import session not found' }, { status: 404 });
    }

    // Tenant check
    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importSession.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: importSession,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get import session error:', error);
    return NextResponse.json({ error: 'Failed to retrieve import session' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(req, [
      'SUPER_ADMIN',
      'ADMIN_STAFF',
      'CAFE_OWNER',
    ]);

    const importSession = await prisma.menuImport.findUnique({
      where: { id: params.id },
    });

    if (!importSession) {
      return NextResponse.json({ error: 'Import session not found' }, { status: 404 });
    }

    // Tenant check
    if (session.role === 'CAFE_OWNER' && importSession.cafeId !== session.cafeId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Delete files from storage
    await deleteImportFiles(params.id);

    // Delete database records (cascading delete handles categories, items, files, etc.)
    await prisma.menuImport.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Import session and uploaded files deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Delete import session error:', error);
    return NextResponse.json({ error: 'Failed to delete import session' }, { status: 500 });
  }
}
