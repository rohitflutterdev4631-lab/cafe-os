import { prisma } from '@/lib/prisma';

export interface DuplicateCheckResult {
  importId: string;
  totalExtractedItems: number;
  newItemsCount: number;
  duplicateItemsCount: number;
  reviewRequiredCount: number;
  matches: Array<{
    importItemId: string;
    importItemName: string;
    importItemPrice: number;
    categoryName: string;
    matchedExistingItem: {
      id: string;
      name: string;
      basePrice: number;
      categoryName: string;
    } | null;
    similarityScore: number;
    suggestedAction: 'IMPORT_AS_NEW' | 'UPDATE_EXISTING' | 'SKIP';
  }>;
}

function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  // Substring or token overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

export async function detectDuplicates(importId: string): Promise<DuplicateCheckResult> {
  const session = await prisma.menuImport.findUnique({
    where: { id: importId },
    include: {
      categories: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Import session ${importId} not found.`);
  }

  // Get existing cafe items
  const existingItems = await prisma.menuItem.findMany({
    where: { cafeId: session.cafeId },
    include: {
      category: true,
    },
  });

  const matches: DuplicateCheckResult['matches'] = [];
  let duplicateCount = 0;
  let newCount = 0;
  let reviewCount = 0;

  for (const category of session.categories) {
    for (const item of category.items) {
      if (item.reviewRequired) {
        reviewCount++;
      }

      let bestMatch: (typeof existingItems)[0] | null = null;
      let highestSimilarity = 0;

      for (const existing of existingItems) {
        const sim = calculateStringSimilarity(item.name, existing.name);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          bestMatch = existing;
        }
      }

      if (bestMatch && highestSimilarity >= 0.55) {
        duplicateCount++;
        // If price differs, suggest UPDATE_EXISTING; if price is identical, suggest SKIP
        const priceDiff = Math.abs(item.extractedPrice - bestMatch.basePrice);
        const suggestedAction = priceDiff > 0.01 ? 'UPDATE_EXISTING' : 'SKIP';

        matches.push({
          importItemId: item.id,
          importItemName: item.name,
          importItemPrice: item.extractedPrice,
          categoryName: category.name,
          matchedExistingItem: {
            id: bestMatch.id,
            name: bestMatch.name,
            basePrice: bestMatch.basePrice,
            categoryName: bestMatch.category.name,
          },
          similarityScore: Math.round(highestSimilarity * 100) / 100,
          suggestedAction,
        });

        // Update database record with match
        await prisma.menuImportItem.update({
          where: { id: item.id },
          data: {
            matchedItemId: bestMatch.id,
            duplicateAction: item.duplicateAction || suggestedAction,
          },
        });
      } else {
        newCount++;
        matches.push({
          importItemId: item.id,
          importItemName: item.name,
          importItemPrice: item.extractedPrice,
          categoryName: category.name,
          matchedExistingItem: null,
          similarityScore: 0,
          suggestedAction: 'IMPORT_AS_NEW',
        });

        await prisma.menuImportItem.update({
          where: { id: item.id },
          data: {
            matchedItemId: null,
            duplicateAction: 'IMPORT_AS_NEW',
          },
        });
      }
    }
  }

  return {
    importId,
    totalExtractedItems: session.categories.reduce((acc, c) => acc + c.items.length, 0),
    newItemsCount: newCount,
    duplicateItemsCount: duplicateCount,
    reviewRequiredCount: reviewCount,
    matches,
  };
}
