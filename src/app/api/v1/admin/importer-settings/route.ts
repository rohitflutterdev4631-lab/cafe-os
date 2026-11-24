import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  enabled: 'true',
  allowedFormats: 'pdf,jpg,jpeg,png,webp,docx,xlsx,xls,csv',
  maxUploadSizeMb: '25',
  maxFilesPerImport: '10',
  maxPdfPages: '30',
  aiProvider: 'LOCAL_OCR_AI', // LOCAL_OCR_AI, GEMINI, OPENAI
  ocrEngine: 'tesseract',
  monthlyQuotaPerCafe: '50',
};

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN']);

    const settingsRows = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'importer_',
        },
      },
    });

    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of settingsRows) {
      const cleanKey = row.key.replace('importer_', '');
      settingsMap[cleanKey] = row.value;
    }

    // Check environment API keys presence
    const hasGeminiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;

    return NextResponse.json({
      success: true,
      data: settingsMap,
      providers: {
        geminiConfigured: hasGeminiKey,
        openAiConfigured: hasOpenAiKey,
        localConfigured: true,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Get importer settings error:', error);
    return NextResponse.json({ error: 'Failed to retrieve settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN']);
    const body = await req.json();

    const allowedKeys = [
      'enabled',
      'allowedFormats',
      'maxUploadSizeMb',
      'maxFilesPerImport',
      'maxPdfPages',
      'aiProvider',
      'ocrEngine',
      'monthlyQuotaPerCafe',
    ];

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.includes(key)) {
        await prisma.systemSetting.upsert({
          where: { key: `importer_${key}` },
          update: { value: String(value) },
          create: {
            key: `importer_${key}`,
            value: String(value),
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        action: 'UPDATE_AI_IMPORTER_SETTINGS',
        metadata: JSON.stringify(body),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'AI Menu Importer settings updated successfully.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Update importer settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
