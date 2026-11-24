import { prisma } from '@/lib/prisma';

export interface PublishResult {
  success: boolean;
  importedItemsCount: number;
  updatedItemsCount: number;
  skippedItemsCount: number;
  categoriesCreatedCount: number;
  publishedAt: string;
}

export async function publishImportedMenu(
  importId: string,
  userId: string
): Promise<PublishResult> {
  const session = await prisma.menuImport.findUnique({
    where: { id: importId },
    include: {
      categories: {
        include: {
          items: {
            include: {
              variants: true,
              addons: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Import session ${importId} not found.`);
  }

  if (session.status === 'PUBLISHED') {
    throw new Error('This menu import has already been published.');
  }

  const cafeId = session.cafeId;
  let importedItemsCount = 0;
  let updatedItemsCount = 0;
  let skippedItemsCount = 0;
  let categoriesCreatedCount = 0;

  await prisma.$transaction(async (tx) => {
    // 1. Get existing categories for cafe
    const existingCats = await tx.category.findMany({ where: { cafeId } });
    const catMap = new Map<string, string>(
      existingCats.map((c) => [c.name.toLowerCase().trim(), c.id])
    );

    // 2. Loop through imported categories
    for (const importCat of session.categories) {
      if (importCat.reviewStatus === 'REJECTED') continue;

      const cleanCatName = importCat.name.trim();
      let liveCategoryId = catMap.get(cleanCatName.toLowerCase());

      if (!liveCategoryId) {
        const newCat = await tx.category.create({
          data: {
            cafeId,
            name: cleanCatName,
            description: importCat.description,
            sortOrder: importCat.sortOrder,
            isActive: true,
          },
        });
        liveCategoryId = newCat.id;
        catMap.set(cleanCatName.toLowerCase(), liveCategoryId);
        categoriesCreatedCount++;
      }

      // 3. Process items in this category
      for (const item of importCat.items) {
        if (item.reviewStatus === 'REJECTED') continue;

        const action = item.duplicateAction || 'IMPORT_AS_NEW';

        if (action === 'SKIP') {
          skippedItemsCount++;
          continue;
        }

        if (action === 'UPDATE_EXISTING' && item.matchedItemId) {
          // Update existing item
          await tx.menuItem.update({
            where: { id: item.matchedItemId },
            data: {
              basePrice: item.extractedPrice,
              description: item.description || undefined,
              foodType: item.foodType || 'VEG',
              isAvailable: item.isAvailable,
              preparationMinutes: item.preparationMinutes || 15,
            },
          });
          updatedItemsCount++;
          continue;
        }

        // Action is IMPORT_AS_NEW
        const newMenuItem = await tx.menuItem.create({
          data: {
            cafeId,
            categoryId: liveCategoryId,
            name: item.name.trim(),
            description: item.description,
            basePrice: item.extractedPrice,
            foodType: item.foodType || 'VEG',
            isAvailable: item.isAvailable,
            preparationMinutes: item.preparationMinutes || 15,
            isBestseller: item.isBestseller,
            image: item.image,
          },
        });
        importedItemsCount++;

        // Add variants
        if (item.variants && item.variants.length > 0) {
          for (const v of item.variants) {
            await tx.itemVariant.create({
              data: {
                menuItemId: newMenuItem.id,
                name: v.name,
                price: v.price,
                isDefault: v.isDefault,
              },
            });
          }
        }

        // Add add-ons if present
        if (item.addons && item.addons.length > 0) {
          // Group addons by groupName
          const groups = new Map<string, typeof item.addons>();
          for (const addon of item.addons) {
            const grp = addon.groupName || 'Add-ons';
            if (!groups.has(grp)) groups.set(grp, []);
            groups.get(grp)!.push(addon);
          }

          for (const [groupName, addonList] of groups.entries()) {
            let addonGroup = await tx.addonGroup.findFirst({
              where: { cafeId, name: groupName },
            });

            if (!addonGroup) {
              addonGroup = await tx.addonGroup.create({
                data: {
                  cafeId,
                  name: groupName,
                  minSelect: 0,
                  maxSelect: addonList.length,
                  required: false,
                },
              });
            }

            // Link group to menu item
            await tx.menuItemAddonGroup.create({
              data: {
                menuItemId: newMenuItem.id,
                addonGroupId: addonGroup.id,
              },
            });

            // Create options
            for (const addon of addonList) {
              await tx.addonOption.create({
                data: {
                  addonGroupId: addonGroup.id,
                  name: addon.name,
                  price: addon.price,
                  isAvailable: true,
                },
              });
            }
          }
        }
      }
    }

    // 4. Mark import session as PUBLISHED
    const now = new Date();
    await tx.menuImport.update({
      where: { id: importId },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
      },
    });

    // 5. Audit Log
    await tx.menuImportAuditLog.create({
      data: {
        importId,
        userId,
        action: 'PUBLISHED',
        metadata: JSON.stringify({
          newItems: importedItemsCount,
          updatedItems: updatedItemsCount,
          skippedItems: skippedItemsCount,
          newCategories: categoriesCreatedCount,
        }),
      },
    });
  });

  return {
    success: true,
    importedItemsCount,
    updatedItemsCount,
    skippedItemsCount,
    categoriesCreatedCount,
    publishedAt: new Date().toISOString(),
  };
}
