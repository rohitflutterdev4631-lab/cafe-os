import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN', 'ADMIN_STAFF']);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true,
            cafe: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req, ['SUPER_ADMIN']);
    const { name, email, phone, password, roleName = 'ADMIN_STAFF' } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 400 });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone: phone || null,
        passwordHash,
        status: 'ACTIVE',
        userRoles: {
          create: [{ roleId: role.id }],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
