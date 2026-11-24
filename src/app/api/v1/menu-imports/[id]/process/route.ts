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

    // Tenant check
    if (
      (session.role === 'CAFE_OWNER' || session.role === 'CAFE_MANAGER') &&
      importSession.cafeId !== session.cafeId
    ) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (importSession.files.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one menu file before starting extraction.' },
        { status: 400 }
      );
    }

    if (importSession.status === 'PROCESSING') {
      return NextResponse.json(
        { error: 'Extraction is already in progress for this session.' },
        { status: 400 }
      );
    }

    // Log audit
    await prisma.menuImportAuditLog.create({
      data: {
        importId: params.id,
        userId: session.userId,
        action: 'EXTRACTION_STARTED',
        metadata: JSON.stringify({ filesCount: importSession.files.length }),
      },
    });

    // Start background processing without blocking the response
    processImportSession(params.id).catch((err) => {
      console.error(`[Background Processing Error] Import ${params.id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: 'Document extraction job started in background.',
      status: 'PROCESSING',
      importId: params.id,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Process import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to start processing' }, { status: 500 });
  }
}
