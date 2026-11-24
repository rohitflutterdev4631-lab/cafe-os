import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const cafes = await prisma.cafe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        branches: { select: { id: true, name: true, address: true, phone: true } },
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
        },
        _count: {
          select: {
            menuItems: true,
            categories: true,
            diningTables: true,
            orders: true,
            qrCodes: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, cafes });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to fetch cafes' }, { status: 500 });
  }
}

// Admin-assisted cafe creation
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);
    const body = await req.json();
    const {
      cafeName,
      ownerName,
      ownerEmail,
      ownerPhone,
      tempPassword,
      address,
      planName = 'Pro',
      description,
      themeColor = '#2563EB',
    } = body;

    if (!cafeName || !ownerName || !ownerEmail) {
      return NextResponse.json(
        { error: 'Cafe name, owner name, and owner email are required' },
        { status: 400 }
      );
    }

    // Generate slug
    let baseSlug = cafeName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    if (!baseSlug) baseSlug = 'cafe';

    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.cafe.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const initialPassword = tempPassword || 'NordWelcome2026!';
    const passwordHash = await hashPassword(initialPassword);

    // Roles and Plans
    const ownerRole = await prisma.role.findUnique({ where: { name: 'CAFE_OWNER' } });
    if (!ownerRole) return NextResponse.json({ error: 'System role missing' }, { status: 500 });

    const selectedPlan =
      (await prisma.plan.findUnique({ where: { name: planName } })) ||
      (await prisma.plan.findFirst());

    const result = await prisma.$transaction(async (tx) => {
      // Find or create owner user
      let owner = await tx.user.findUnique({ where: { email: ownerEmail.toLowerCase().trim() } });
      if (!owner) {
        owner = await tx.user.create({
          data: {
            name: ownerName,
            email: ownerEmail.toLowerCase().trim(),
            phone: ownerPhone || null,
            passwordHash,
            status: 'ACTIVE',
          },
        });
      }

      const cafe = await tx.cafe.create({
        data: {
          ownerId: owner.id,
          name: cafeName,
          slug: uniqueSlug,
          description: description || 'Digital menu powered by Nord Cafe',
          status: 'ACTIVE',
          themeColor,
          secondaryColor: '#F8FAFC',
        },
      });

      const branch = await tx.branch.create({
        data: {
          cafeId: cafe.id,
          name: 'Main Branch',
          address: address || 'Main Market, City Center',
          phone: ownerPhone || null,
          isMain: true,
        },
      });

      for (let day = 0; day < 7; day++) {
        await tx.businessHour.create({
          data: {
            branchId: branch.id,
            weekday: day,
            openingTime: '08:00',
            closingTime: '23:00',
            isClosed: false,
          },
        });
      }

      await tx.cafeSetting.create({
        data: {
          cafeId: cafe.id,
          currency: 'INR',
          currencySymbol: '₹',
          taxRatePercent: 5.0,
          orderingEnabled: true,
          dineInEnabled: true,
          takeawayEnabled: true,
        },
      });

      // General QR
      await tx.qRCode.create({
        data: {
          cafeId: cafe.id,
          branchId: branch.id,
          type: 'CAFE_GENERAL',
          token: `qr_${uniqueSlug}_general`,
          targetUrl: `/c/${uniqueSlug}`,
          status: 'ACTIVE',
        },
      });

      // Default Table 1 & Table 2
      for (let i = 1; i <= 3; i++) {
        const tableNum = `T-0${i}`;
        const table = await tx.diningTable.create({
          data: {
            cafeId: cafe.id,
            branchId: branch.id,
            tableNumber: tableNum,
            capacity: 4,
            status: 'AVAILABLE',
          },
        });

        const qr = await tx.qRCode.create({
          data: {
            cafeId: cafe.id,
            branchId: branch.id,
            tableId: table.id,
            type: 'TABLE',
            token: `qr_${uniqueSlug}_t${i}`,
            targetUrl: `/c/${uniqueSlug}?table=${tableNum}`,
            status: 'ACTIVE',
          },
        });

        await tx.diningTable.update({
          where: { id: table.id },
          data: { qrCodeId: qr.id },
        });
      }

      // Link UserRole
      await tx.userRole.upsert({
        where: {
          userId_roleId_cafeId_branchId: {
            userId: owner.id,
            roleId: ownerRole.id,
            cafeId: cafe.id,
            branchId: branch.id,
          },
        },
        create: {
          userId: owner.id,
          roleId: ownerRole.id,
          cafeId: cafe.id,
          branchId: branch.id,
        },
        update: {},
      });

      // Subscription
      if (selectedPlan) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        await tx.subscription.create({
          data: {
            cafeId: cafe.id,
            planId: selectedPlan.id,
            status: 'ACTIVE',
            billingInterval: 'YEARLY',
            startDate: new Date(),
            endDate: expiry,
          },
        });
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.userId,
          cafeId: cafe.id,
          action: 'ADMIN_ASSISTED_CAFE_CREATION',
          metadata: JSON.stringify({
            createdCafe: cafe.name,
            slug: cafe.slug,
            ownerEmail: owner.email,
          }),
        },
      });

      return { cafe, owner, branch, initialPassword };
    });

    return NextResponse.json({
      success: true,
      message: 'Cafe onboarded successfully by Admin',
      cafe: result.cafe,
      credentials: {
        email: result.owner.email,
        temporaryPassword: result.initialPassword,
      },
    });
  } catch (error: any) {
    console.error('Admin create cafe error:', error);
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    return NextResponse.json({ error: 'Failed to onboard cafe' }, { status: 500 });
  }
}
