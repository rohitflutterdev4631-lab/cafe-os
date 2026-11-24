import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { processImportSession } from '@/lib/importer/processor';

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
      include: { files: true },
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

    if (importSession.files.length === 0) {
      return NextResponse.json(
        { error: 'Cannot retry extraction: No files were uploaded.' },
        { status: 400 }
      );
    }

    // Reset status and start processing
    await prisma.menuImport.update({
      where: { id: params.id },
      data: {
        status: 'PROCESSING',
        processingProgress: 5,
        errorMessage: null,
      },
    });

    await prisma.menuImportAuditLog.create({
      data: {
        importId: params.id,
        userId: session.userId,
        action: 'RETRY_STARTED',
        metadata: JSON.stringify({ retriedBy: session.email }),
      },
    });

    // Start background processing
    processImportSession(params.id).catch((err) => {
      console.error(`[Background Retry Error] Import ${params.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Retry processing started in background.',
      status: 'PROCESSING',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Retry error:', error);
    return NextResponse.json({ error: error.message || 'Failed to retry processing' }, { status: 500 });
  }
}
