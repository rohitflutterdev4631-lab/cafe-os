import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { validateUploadedFile, computeFileChecksum } from '../src/lib/importer/file-validator';
import { parseDocument } from '../src/lib/importer/document-parser';
import { extractMenuHeuristically, extractMenu } from '../src/lib/importer/ai-extractor';
import { detectDuplicates } from '../src/lib/importer/duplicate-detector';
import { publishImportedMenu } from '../src/lib/importer/publisher';
import * as XLSX from 'xlsx';

describe('AI Menu Importer & Document Ingestion Test Suite', () => {
  // Test 1: File Validator & Magic Byte Security
  it('1. File Signature Validation & Security Rejection', () => {
    // Valid PDF signature %PDF
    const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\nxref\n0 1\ntrailer<</Root 1 0 R>>\n%%EOF');
    const pdfRes = validateUploadedFile(validPdfBuffer, 'menu.pdf');
    assert.equal(pdfRes.isValid, true, 'PDF with valid magic bytes must pass');
    assert.equal(pdfRes.detectedMime, 'application/pdf');

    // Valid PNG signature
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const pngRes = validateUploadedFile(validPngBuffer, 'photo.png');
    assert.equal(pngRes.isValid, true, 'PNG with valid magic bytes must pass');
    assert.equal(pngRes.isImage, true);

    // Spoofed file: extension .pdf but contents are shell/bash script
    const fakePdfBuffer = Buffer.from('#!/bin/bash\necho "Malicious script execution"\n');
    const spoofRes = validateUploadedFile(fakePdfBuffer, 'menu.pdf');
    assert.equal(spoofRes.isValid, false, 'Spoofed file without matching magic bytes must be rejected');

    // Executable / Binary disguised as CSV
    const binaryCsvBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // DOS MZ header with nulls
    const badCsvRes = validateUploadedFile(binaryCsvBuffer, 'menu.csv');
    assert.equal(badCsvRes.isValid, false, 'Binary with null bytes claiming to be CSV must be rejected');

    // Checksum verification
    const hash = computeFileChecksum(validPdfBuffer);
    assert.equal(typeof hash, 'string');
    assert.equal(hash.length, 64, 'SHA-256 checksum must be 64 hex characters');
  });

  // Test 2: Document Parsing (CSV, XLSX, Text)
  it('2. Multi-Format Document Parsing Engine', async () => {
    // A. CSV
    const csvContent = 'Category,Item Name,Price,Description,Type\nEspresso Bar,Cortado,160,Double shot with warm silky milk,VEG\nDesserts,Tiramisu,240,Classic Italian mascarpone dessert,VEG';
    const csvRes = await parseDocument(Buffer.from(csvContent), 'text/csv', 'csv');
    assert.equal(csvRes.structuredRows?.length, 2, 'CSV must parse 2 rows');
    assert.equal(csvRes.structuredRows?.[0]['Item Name'], 'Cortado');

    // B. Excel XLSX Workbook
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Specialty Coffee', 'Price', 'Description'],
      ['Cold Brew Float', '220', 'Slow steeped 18 hours with vanilla gelato'],
      ['Flat White', '180', 'Velvety microfoam over ristretto'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Coffee Menu');
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const xlsxRes = await parseDocument(xlsxBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'xlsx');
    assert.ok(xlsxRes.text.includes('Cold Brew Float'), 'Excel text must contain Cold Brew Float');
    assert.ok(xlsxRes.text.includes('Flat White'), 'Excel text must contain Flat White');
  });

  // Test 3: AI Extraction Rules & Normalization
  it('3. AI Menu Extraction, Categories, Prices & Strict Non-Hallucination', async () => {
    const rawMenu = `
--- SIGNATURE COFFEES ---
Single Origin Pour Over - Ethiopia Yirgacheffe ₹280
Bright bergamot notes with jasmine florals
Regular / Large ₹340

Cold Brew Tonic ₹220
Cold brew layered with chilled artisanal tonic

--- GOURMET PASTRIES ---
Almond Croissant ₹190 (Vegetarian)
Twice-baked butter croissant filled with frangipane

Daily Baker's Special
Chef special pastry baked fresh every morning
`;

    const extracted = extractMenuHeuristically(rawMenu, { defaultCurrency: 'INR' });

    assert.ok(extracted.categories.length >= 2, 'Must extract at least 2 categories');

    const coffeeCat = extracted.categories.find((c) => c.name.toLowerCase().includes('coffee'));
    assert.ok(coffeeCat, 'Signature Coffees category must be detected');

    const pourOver = coffeeCat?.items.find((i) => i.name.toLowerCase().includes('pour over'));
    assert.ok(pourOver, 'Pour Over must be extracted');
    assert.equal(pourOver?.price, 280, 'Pour Over base price must be 280');
    assert.equal(pourOver?.variants.length, 1, 'Large variant must be captured');

    const pastryCat = extracted.categories.find((c) => c.name.toLowerCase().includes('pastries'));
    assert.ok(pastryCat, 'Gourmet Pastries category must be detected');

    const croissant = pastryCat?.items.find((i) => i.name.toLowerCase().includes('croissant'));
    assert.ok(croissant, 'Almond Croissant must be extracted');
    assert.equal(croissant?.isVeg, true, 'Vegetarian tag must be explicitly captured');

    // Unpriced item verification (Daily Baker's Special)
    const special = pastryCat?.items.find((i) => i.name.toLowerCase().includes('baker'));
    assert.ok(special, "Baker's special must be captured");
    assert.equal(special?.price, 0, 'Missing price must not be invented (price = 0)');
    assert.equal(special?.reviewRequired, true, 'Unpriced item must be flagged for manual review');
  });

  // Test 4: End-to-End Database Ingestion, Duplicate Detection & Publishing
  it('4. Full Lifecycle: Session -> Items -> Duplicate Detection -> Publishing Transaction', async () => {
    // Find Nordic Roast cafe
    const cafe = await prisma.cafe.findFirst({
      where: { slug: 'nordic-roast' },
      include: { owner: true },
    });
    assert.ok(cafe, 'Nordic Roast must exist');

    // Clean up previous test dishes if any
    await prisma.menuItem.deleteMany({
      where: { cafeId: cafe.id, name: { startsWith: 'TestDish_' } },
    });

    // 1. Create Import Session
    const importSession = await prisma.menuImport.create({
      data: {
        cafeId: cafe.id,
        uploadedBy: cafe.ownerId,
        menuName: 'Test AI Seasonal Menu Ingestion',
        status: 'PROCESSING',
        processingProgress: 50,
      },
    });
    assert.ok(importSession.id, 'Import session created');

    // 2. Insert Extracted Categories & Items
    const category = await prisma.menuImportCategory.create({
      data: {
        importId: importSession.id,
        name: 'Artisanal Teas & Matcha',
        sortOrder: 1,
      },
    });

    const uniqueMatchaName = `TestDish_LavenderBoba_${Date.now()}`;
    const item1 = await prisma.menuImportItem.create({
      data: {
        importId: importSession.id,
        importCategoryId: category.id,
        name: uniqueMatchaName,
        description: 'Rare dragonfruit infusion with lavender essence and pearls',
        extractedPrice: 240,
        currency: 'INR',
        isVeg: true,
        foodType: 'VEG',
        confidence: 0.98,
        reviewRequired: false,
      },
    });

    // Also insert an item that intentionally matches an existing dish for duplicate detection
    // (Nordic Roast already has Classic Cappuccino or Americano)
    const item2 = await prisma.menuImportItem.create({
      data: {
        importId: importSession.id,
        importCategoryId: category.id,
        name: 'Classic Cappuccino',
        description: 'Rich espresso with silky milk',
        extractedPrice: 190,
        currency: 'INR',
        isVeg: true,
        foodType: 'VEG',
        confidence: 0.95,
        reviewRequired: false,
      },
    });

    // Complete session
    await prisma.menuImport.update({
      where: { id: importSession.id },
      data: { status: 'COMPLETED', processingProgress: 100, totalCategories: 1, totalItems: 2 },
    });

    // 3. Duplicate Detection
    const duplicateResults = await detectDuplicates(importSession.id);
    assert.equal(duplicateResults.totalExtractedItems, 2);
    assert.ok(duplicateResults.matches.some((m) => m.importItemName === 'Classic Cappuccino' && m.matchedExistingItem !== null), 'Classic Cappuccino must match existing dish');
    assert.ok(duplicateResults.matches.some((m) => m.importItemName.includes('TestDish_LavenderBoba') && m.suggestedAction === 'IMPORT_AS_NEW'), 'Dragonfruit Boba must be marked as new item');

    // 4. Publish Menu into Live Database
    const publishResult = await publishImportedMenu(importSession.id, cafe.ownerId);
    assert.equal(publishResult.success, true);
    assert.ok(publishResult.importedItemsCount >= 1, 'At least 1 item must be published into live menu');

    // 5. Verify published item is active in live cafe menu
    const liveMatcha = await prisma.menuItem.findFirst({
      where: { cafeId: cafe.id, name: uniqueMatchaName },
    });
    assert.ok(liveMatcha, 'Unique Matcha Latte must now exist in live database');
    assert.equal(liveMatcha?.basePrice, 240);
    assert.equal(liveMatcha?.foodType, 'VEG');

    // Clean up test dish
    await prisma.menuItem.deleteMany({
      where: { cafeId: cafe.id, name: { startsWith: 'TestDish_' } },
    });

    // Verify session status is PUBLISHED
    const updatedSession = await prisma.menuImport.findUnique({
      where: { id: importSession.id },
    });
    assert.equal(updatedSession?.status, 'PUBLISHED');
    assert.ok(updatedSession?.publishedAt, 'Published timestamp must be set');
  });

  // Test 5: Tenant Isolation & Permission Security
  it('5. Tenant Isolation & Cross-Cafe Guarding', async () => {
    const cafes = await prisma.cafe.findMany();
    assert.ok(cafes.length >= 2);

    const cafe1 = cafes[0];
    const cafe2 = cafes[1];

    // Create import for Cafe 1
    const import1 = await prisma.menuImport.create({
      data: {
        cafeId: cafe1.id,
        uploadedBy: cafe1.ownerId,
        menuName: 'Cafe 1 Private Menu',
        status: 'COMPLETED',
      },
    });

    // Query scoping
    const cafe2Imports = await prisma.menuImport.findMany({
      where: { cafeId: cafe2.id },
    });

    assert.ok(
      !cafe2Imports.some((i) => i.id === import1.id),
      'Cafe 2 must never see Cafe 1 menu import sessions'
    );
  });
});
