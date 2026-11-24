import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { generateQRCodeDataUrl, generateQRCodeSvg } from '@/lib/qr';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'CAFE_MANAGER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const qrCodes = await prisma.qRCode.findMany({
      where: { cafeId },
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        branch: true,
      },
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Enrich with dynamic live SVG and data URL
    const enriched = await Promise.all(
      qrCodes.map(async (qr) => {
        const fullUrl = `${baseUrl}/qr/${qr.token}`;
        const dataUrl = await generateQRCodeDataUrl(fullUrl);
        return {
          ...qr,
          fullUrl,
          dataUrl,
        };
      })
    );

    return NextResponse.json({ success: true, qrCodes: enriched });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ error: 'No cafe associated with user' }, { status: 404 });
    }

    const body = await req.json();
    const { type = 'CUSTOM', targetPath = '', name = 'Custom QR' } = body;

    const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

    const token = `qr_${cafe.slug}_${Date.now().toString(36)}`;
    const destination = targetPath.startsWith('/') ? targetPath : `/c/${cafe.slug}`;

    const qr = await prisma.qRCode.create({
      data: {
        cafeId,
        type,
        token,
        targetUrl: destination,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ success: true, qrCode: qr });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
