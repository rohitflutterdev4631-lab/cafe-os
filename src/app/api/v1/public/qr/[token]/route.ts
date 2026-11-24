import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const qr = await prisma.qRCode.findUnique({
      where: { token: params.token },
      include: { cafe: true, table: true },
    });

    if (!qr || qr.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'QR code not found or expired' }, { status: 404 });
    }

    // Increment scan count and log menu scan
    await prisma.$transaction([
      prisma.qRCode.update({
        where: { id: qr.id },
        data: { scanCount: { increment: 1 } },
      }),
      prisma.menuScan.create({
        data: {
          cafeId: qr.cafeId,
          branchId: qr.branchId,
          qrCodeId: qr.id,
          userAgent: req.headers.get('user-agent'),
          ipAddress: req.headers.get('x-forwarded-for') || null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      targetUrl: qr.targetUrl,
      cafeSlug: qr.cafe.slug,
      tableNumber: qr.table?.tableNumber || null,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve QR destination' }, { status: 500 });
  }
}
