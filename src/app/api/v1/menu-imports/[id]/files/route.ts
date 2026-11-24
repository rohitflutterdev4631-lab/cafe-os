import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { validateUploadedFile, computeFileChecksum } from '@/lib/importer/file-validator';
import { saveImportFile } from '@/lib/importer/storage';

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

    if (importSession.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot upload files to an already published import session' },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const uploadedFiles = formData.getAll('files') as File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      // Also check single 'file'
      const singleFile = formData.get('file') as File;
      if (singleFile) {
        uploadedFiles.push(singleFile);
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Max files check
    if (importSession.files.length + uploadedFiles.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 files allowed per menu import session' },
        { status: 400 }
      );
    }

    const savedRecords = [];

    for (const file of uploadedFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateUploadedFile(buffer, file.name);

      if (!validation.isValid) {
        return NextResponse.json(
          { error: `File "${file.name}" rejected: ${validation.error}` },
          { status: 400 }
        );
      }

      const checksum = computeFileChecksum(buffer);

      // Prevent duplicate file upload in same import
      const isDuplicate = importSession.files.some((f) => f.checksum === checksum);
      if (isDuplicate) {
        return NextResponse.json(
          { error: `File "${file.name}" has already been uploaded to this session` },
          { status: 400 }
        );
      }

      const { storageKey } = await saveImportFile(params.id, file.name, buffer);

      const fileRecord = await prisma.menuImportFile.create({
        data: {
          importId: params.id,
          originalFilename: file.name,
          storageKey,
          mimeType: validation.detectedMime,
          fileSize: buffer.length,
          checksum,
          processingStatus: 'PENDING',
        },
      });

      savedRecords.push(fileRecord);
    }

    // Audit log
    await prisma.menuImportAuditLog.create({
      data: {
        importId: params.id,
        userId: session.userId,
        action: 'UPLOADED_FILES',
        metadata: JSON.stringify({
          filesCount: savedRecords.length,
          filenames: savedRecords.map((r) => r.originalFilename),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: savedRecords,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('File upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload files' }, { status: 500 });
  }
}
