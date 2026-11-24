import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req, ['CAFE_OWNER', 'ADMIN_STAFF', 'SUPER_ADMIN']);
    const body = await req.json();
    const { cafeId: requestedCafeId, csvContent } = body;

    const targetCafeId = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN_STAFF'
      ? requestedCafeId || session.cafeId
      : session.cafeId;

    if (!targetCafeId) {
      return NextResponse.json({ error: 'Target cafe ID is required' }, { status: 400 });
    }

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'CSV content string is required' }, { status: 400 });
    }

    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV: ' + parsed.errors[0].message }, { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];
    let importedItemsCount = 0;
    let categoriesCreatedCount = 0;

    // Cache existing categories
    const existingCats = await prisma.category.findMany({ where: { cafeId: targetCafeId } });
    const catMap = new Map<string, string>(existingCats.map((c) => [c.name.toLowerCase().trim(), c.id]));

    for (const row of rows) {
      const catName = row['Category'] || row['category'] || 'General';
      const itemName = row['Item Name'] || row['Item'] || row['name'];
      const priceStr = row['Price'] || row['price'] || '0';
      const desc = row['Description'] || row['description'] || '';
      const typeStr = (row['Food Type'] || row['Type'] || 'VEG').toUpperCase();
      const foodType = typeStr.includes('NON') ? 'NON_VEG' : typeStr.includes('EGG') ? 'EGG' : 'VEG';
      const prepTime = parseInt(row['Prep Time'] || row['prep_time'] || '15', 10);

      if (!itemName) continue;

      const cleanCat = catName.trim();
      let categoryId = catMap.get(cleanCat.toLowerCase());

      if (!categoryId) {
        const newCat = await prisma.category.create({
          data: {
            cafeId: targetCafeId,
            name: cleanCat,
            isActive: true,
          },
        });
        categoryId = newCat.id;
        catMap.set(cleanCat.toLowerCase(), categoryId);
        categoriesCreatedCount++;
      }

      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;

      await prisma.menuItem.create({
        data: {
          cafeId: targetCafeId,
          categoryId,
          name: itemName.trim(),
          description: desc.trim() || null,
          basePrice: price,
          foodType,
          preparationMinutes: prepTime,
          isAvailable: true,
        },
      });

      importedItemsCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedItemsCount} items into ${catMap.size} categories.`,
      importedItems: importedItemsCount,
      newCategories: categoriesCreatedCount,
    });
  } catch (error: any) {
    console.error('CSV import error:', error);
    if (error.message === 'UNAUTHORIZED' || error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to import menu CSV' }, { status: 500 });
  }
}
