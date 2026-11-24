import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const rules = await prisma.automationRule.findMany({
      where: { cafeId },
      include: {
        logs: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['SUPER_ADMIN', 'CAFE_OWNER', 'CAFE_MANAGER']);
    const cafeId = session.cafeId;

    if (!cafeId) {
      return NextResponse.json({ success: false, error: 'No cafe associated' }, { status: 400 });
    }

    const body = await req.json();
    const { name, trigger, conditionJson, actionType, actionConfigJson, isActive } = body;

    if (!name || !trigger || !actionType) {
      return NextResponse.json({ success: false, error: 'Name, trigger, and actionType required' }, { status: 400 });
    }

    const rule = await prisma.automationRule.create({
      data: {
        cafeId,
        name,
        trigger,
        conditionJson: typeof conditionJson === 'object' ? JSON.stringify(conditionJson) : conditionJson || '{}',
        actionType,
        actionConfigJson: typeof actionConfigJson === 'object' ? JSON.stringify(actionConfigJson) : actionConfigJson || '{}',
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = await req.json();
    const { id, isActive, simulateTrigger } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Rule ID required' }, { status: 400 });
    }

    if (simulateTrigger) {
      // Simulate an execution log for demo
      const rule = await prisma.automationRule.findUnique({ where: { id } });
      if (!rule) return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 });

      const updated = await prisma.$transaction(async (tx) => {
        await tx.automationLog.create({
          data: {
            ruleId: id,
            cafeId: rule.cafeId,
            triggerEvent: rule.trigger,
            status: 'SUCCESS',
            message: `Simulated trigger for ${rule.name}: action ${rule.actionType} dispatched successfully.`,
          },
        });

        return tx.automationRule.update({
          where: { id },
          data: {
            executionCount: { increment: 1 },
            lastExecutedAt: new Date(),
          },
        });
      });

      return NextResponse.json({ success: true, rule: updated });
    }

    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
