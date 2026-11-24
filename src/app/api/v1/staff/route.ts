import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) return NextResponse.json({ error: 'No cafe associated' }, { status: 404 });

    const userRoles = await prisma.userRole.findMany({
      where: { cafeId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, status: true, createdAt: true },
        },
        role: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, staff: userRoles });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'SUPER_ADMIN']);
    const cafeId = session.cafeId;

    if (!cafeId) return NextResponse.json({ error: 'No cafe associated' }, { status: 404 });

    // Check staff count vs plan limit
    const activeSub = await prisma.subscription.findFirst({
      where: { cafeId, status: 'ACTIVE' },
      include: { plan: true },
    });
    const currentStaffCount = await prisma.userRole.count({ where: { cafeId } });
    const staffLimit = activeSub?.plan?.staffLimit ?? 1;

    if (currentStaffCount >= staffLimit) {
      return NextResponse.json(
        {
          error: `Staff limit reached (${currentStaffCount}/${staffLimit}). Please upgrade your plan to add more team members.`,
        },
        { status: 403 }
      );
    }

    const { name, email, phone, password, roleName = 'KITCHEN_STAFF', branchId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 400 });

    const passwordHash = await hashPassword(password);

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          phone: phone || null,
          passwordHash,
          status: 'ACTIVE',
        },
      });
    }

    // Assign role
    const assigned = await prisma.userRole.upsert({
      where: {
        userId_roleId_cafeId_branchId: {
          userId: user.id,
          roleId: role.id,
          cafeId,
          branchId: branchId || null,
        },
      },
      create: {
        userId: user.id,
        roleId: role.id,
        cafeId,
        branchId: branchId || null,
      },
      update: {},
    });

    return NextResponse.json({ success: true, message: 'Staff member added successfully', staff: assigned });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 });
  }
}
