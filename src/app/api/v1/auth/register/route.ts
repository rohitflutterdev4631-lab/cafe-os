import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password, cafeName } = await req.json();

    if (!name || !email || !password || !cafeName) {
      return NextResponse.json(
        { error: 'Name, email, password, and cafe name are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Generate slug from cafe name
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

    const passwordHash = await hashPassword(password);

    // Get CAFE_OWNER role
    const ownerRole = await prisma.role.findUnique({
      where: { name: 'CAFE_OWNER' },
    });

    if (!ownerRole) {
      return NextResponse.json(
        { error: 'Role system error. Please contact administrator.' },
        { status: 500 }
      );
    }

    // Get Free plan
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'Free' },
    });

    // Execute in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          passwordHash,
          status: 'ACTIVE',
        },
      });

      const cafe = await tx.cafe.create({
        data: {
          ownerId: user.id,
          name: cafeName,
          slug: uniqueSlug,
          status: 'ACTIVE',
          themeColor: '#2563EB',
          secondaryColor: '#F8FAFC',
        },
      });

      const branch = await tx.branch.create({
        data: {
          cafeId: cafe.id,
          name: 'Main Branch',
          address: 'Main Market, City Center',
          phone: phone || null,
          isMain: true,
        },
      });

      // Default opening hours
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
          packagingFee: 0,
          orderingEnabled: true,
          dineInEnabled: true,
          takeawayEnabled: true,
        },
      });

      // Add general QR code for cafe
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

      // Initial table
      const initialTable = await tx.diningTable.create({
        data: {
          cafeId: cafe.id,
          branchId: branch.id,
          tableNumber: 'T-01',
          capacity: 4,
          status: 'AVAILABLE',
        },
      });

      const tableQr = await tx.qRCode.create({
        data: {
          cafeId: cafe.id,
          branchId: branch.id,
          tableId: initialTable.id,
          type: 'TABLE',
          token: `qr_${uniqueSlug}_t1`,
          targetUrl: `/c/${uniqueSlug}?table=T-01`,
          status: 'ACTIVE',
        },
      });

      await tx.diningTable.update({
        where: { id: initialTable.id },
        data: { qrCodeId: tableQr.id },
      });

      // UserRole
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: ownerRole.id,
          cafeId: cafe.id,
          branchId: branch.id,
        },
      });

      // Subscription
      if (freePlan) {
        const expiry = new Date();
        expiry.setFullYear(expiry.getFullYear() + 1);
        await tx.subscription.create({
          data: {
            cafeId: cafe.id,
            planId: freePlan.id,
            status: 'ACTIVE',
            billingInterval: 'MONTHLY',
            startDate: new Date(),
            endDate: expiry,
          },
        });
      }

      return { user, cafe, branch };
    });

    // Create session token
    const token = await createSessionToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: 'CAFE_OWNER',
      cafeId: result.cafe.id,
      branchId: result.branch.id,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully',
      cafe: result.cafe,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
