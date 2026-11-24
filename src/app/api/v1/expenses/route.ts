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

    const expenses = await prisma.expense.findMany({
      where: { cafeId },
      orderBy: { date: 'desc' },
    });

    // Compute category breakdown and totals
    const categoryTotals: Record<string, number> = {};
    let totalExpense = 0;

    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      totalExpense += e.amount;
    });

    // Also get this month's revenue to compute estimated gross & net profit!
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedOrders = await prisma.order.findMany({
      where: {
        cafeId,
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { totalAmount: true, subtotal: true, taxAmount: true },
    });

    const totalRevenue = completedOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    // Estimate COGS (approx 30% of subtotal for standard cafe operations or sum of usage movements)
    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventoryItem: { cafeId },
        type: { in: ['USAGE', 'WASTAGE'] },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { cost: true },
    });
    const recordedCogs = movements.reduce((acc, m) => acc + (m.cost || 0), 0);
    const estimatedCogs = recordedCogs > 0 ? recordedCogs : Math.round(totalRevenue * 0.28);

    const grossProfit = totalRevenue - estimatedCogs;
    const netProfit = grossProfit - totalExpense;

    return NextResponse.json({
      success: true,
      expenses,
      categoryTotals,
      financialSummary: {
        totalRevenue: Math.round(totalRevenue),
        estimatedCogs: Math.round(estimatedCogs),
        grossProfit: Math.round(grossProfit),
        grossMarginPercent: totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0,
        totalExpenses: Math.round(totalExpense),
        netProfit: Math.round(netProfit),
        netMarginPercent: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0,
      },
    });
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
    const { category, title, amount, paymentMethod, notes, date } = body;

    if (!title || !amount || !category) {
      return NextResponse.json({ success: false, error: 'Title, amount, and category required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        cafeId,
        category,
        title,
        amount: Number(amount),
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        date: date ? new Date(date) : new Date(),
        status: 'APPROVED',
        approvedBy: session.name,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
