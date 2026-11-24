import { prisma } from '@/lib/prisma';
import { readImportFile } from './storage';
import { parseDocument } from './document-parser';
import { extractMenu } from './ai-extractor';

export async function processImportSession(importId: string): Promise<void> {
  const session = await prisma.menuImport.findUnique({
    where: { id: importId },
    include: {
      files: true,
      cafe: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error(`Menu import session ${importId} not found.`);
  }

  // Set status to PROCESSING
  await prisma.menuImport.update({
    where: { id: importId },
    data: {
      status: 'PROCESSING',
      processingProgress: 10,
      errorMessage: null,
    },
  });

  // Create or update job record
  const job = await prisma.menuImportJob.create({
    data: {
      importId,
      provider: 'LOCAL_OCR_AI',
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  try {
    let combinedRawText = '';
    let totalPages = 0;

    // Step 1: Parse all files (progress 10% -> 50%)
    for (let i = 0; i < session.files.length; i++) {
      const fileRecord = session.files[i];

      await prisma.menuImportFile.update({
        where: { id: fileRecord.id },
        data: { processingStatus: 'PROCESSING' },
      });

      const buffer = await readImportFile(fileRecord.storageKey);
      const parsed = await parseDocument(
        buffer,
        fileRecord.mimeType,
        fileRecord.originalFilename.split('.').pop() || ''
      );

      combinedRawText += `\n\n=== SOURCE FILE: ${fileRecord.originalFilename} ===\n${parsed.text}`;
      totalPages += parsed.pageCount;

      await prisma.menuImportFile.update({
        where: { id: fileRecord.id },
        data: {
          processingStatus: 'COMPLETED',
          extractedText: parsed.text,
          pageCount: parsed.pageCount,
        },
      });

      const progressVal = 10 + Math.round(((i + 1) / session.files.length) * 40);
      await prisma.menuImport.update({
        where: { id: importId },
        data: { processingProgress: progressVal },
      });
    }

    if (!combinedRawText.trim()) {
      throw new Error('No text or menu data could be extracted from the uploaded document(s).');
    }

    // Step 2: AI Extraction (progress 50% -> 80%)
    await prisma.menuImport.update({
      where: { id: importId },
      data: { processingProgress: 60 },
    });

    const defaultCurrency = session.cafe?.settings?.currency || session.currency || 'INR';
    const extracted = await extractMenu(combinedRawText, {
      provider: 'LOCAL_OCR_AI',
      defaultCurrency,
      sourceFilename: session.files[0]?.originalFilename,
    });

    await prisma.menuImport.update({
      where: { id: importId },
      data: { processingProgress: 80 },
    });

    // Step 3: Database persistence (progress 80% -> 100%)
    let categoryCount = 0;
    let itemCount = 0;

    await prisma.$transaction(async (tx) => {
      // Clear previous categories/items if this is a retry
      await tx.menuImportCategory.deleteMany({ where: { importId } });

      for (const cat of extracted.categories) {
        const dbCategory = await tx.menuImportCategory.create({
          data: {
            importId,
            name: cat.name,
            description: cat.description,
            sortOrder: cat.sortOrder,
            reviewStatus: 'PENDING_REVIEW',
          },
        });
        categoryCount++;

        for (const item of cat.items) {
          const dbItem = await tx.menuImportItem.create({
            data: {
              importId,
              importCategoryId: dbCategory.id,
              name: item.name,
              description: item.description,
              extractedPrice: item.price,
              currency: item.currency || defaultCurrency,
              confidence: item.confidence,
              sourcePage: item.sourcePage,
              sourceFile: session.files[0]?.originalFilename || null,
              reviewStatus: item.reviewRequired ? 'PENDING_REVIEW' : 'APPROVED',
              reviewRequired: item.reviewRequired,
              isVeg: item.isVeg,
              foodType: item.isVeg === true ? 'VEG' : item.isVeg === false ? 'NON_VEG' : null,
              isAvailable: item.isAvailable,
              notes: item.notes,
            },
          });
          itemCount++;

          // Create variants if present
          if (item.variants && item.variants.length > 0) {
            for (const v of item.variants) {
              await tx.menuImportVariant.create({
                data: {
                  importItemId: dbItem.id,
                  name: v.name,
                  price: v.price,
                  isDefault: v.isDefault,
                },
              });
            }
          }

          // Create add-ons if present
          if (item.addons && item.addons.length > 0) {
            for (const a of item.addons) {
              await tx.menuImportAddon.create({
                data: {
                  importItemId: dbItem.id,
                  name: a.name,
                  price: a.price,
                  groupName: a.groupName || 'Add-ons',
                },
              });
            }
          }
        }
      }

      // Update session status to COMPLETED
      await tx.menuImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          processingProgress: 100,
          totalCategories: categoryCount,
          totalItems: itemCount,
          currency: extracted.currency || defaultCurrency,
        },
      });

      // Update job record
      await tx.menuImportJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Audit log
      await tx.menuImportAuditLog.create({
        data: {
          importId,
          userId: session.uploadedBy,
          action: 'EXTRACTION_COMPLETED',
          metadata: JSON.stringify({
            categories: categoryCount,
            items: itemCount,
            pages: totalPages,
          }),
        },
      });
    });

    console.log(
      `[AI Importer] Processed session ${importId} successfully: ${categoryCount} categories, ${itemCount} items.`
    );
  } catch (error: any) {
    console.error(`[AI Importer] Session ${importId} failed:`, error);

    await prisma.menuImport.update({
      where: { id: importId },
      data: {
        status: 'FAILED',
        errorMessage: error.message || 'An error occurred during menu extraction.',
        processingProgress: 0,
      },
    });

    await prisma.menuImportJob.update({
      where: { id: job.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date(),
      },
    });

    await prisma.menuImportAuditLog.create({
      data: {
        importId,
        userId: session.uploadedBy,
        action: 'EXTRACTION_FAILED',
        metadata: JSON.stringify({ error: error.message }),
      },
    });
  }
}
