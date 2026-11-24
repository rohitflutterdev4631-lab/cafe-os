import { z } from 'zod';

// Zod schemas for validated structured extraction
export const ExtractedVariantSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  isDefault: z.boolean().default(false),
});

export const ExtractedAddonSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0),
  groupName: z.string().default('Add-ons'),
});

export const ExtractedItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  price: z.number().min(0),
  currency: z.string().default('INR'),
  variants: z.array(ExtractedVariantSchema).default([]),
  addons: z.array(ExtractedAddonSchema).default([]),
  isVeg: z.boolean().nullable().default(null),
  isAvailable: z.boolean().default(true),
  confidence: z.number().min(0).max(1).default(1.0),
  sourcePage: z.number().default(1),
  reviewRequired: z.boolean().default(false),
  notes: z.string().nullable().default(null),
});

export const ExtractedCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  sortOrder: z.number().default(0),
  items: z.array(ExtractedItemSchema).default([]),
});

export const ExtractedMenuSchema = z.object({
  menuName: z.string().default('Imported Menu'),
  currency: z.string().default('INR'),
  categories: z.array(ExtractedCategorySchema),
});

export type ExtractedMenu = z.infer<typeof ExtractedMenuSchema>;
export type ExtractedCategory = z.infer<typeof ExtractedCategorySchema>;
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export interface ExtractionOptions {
  provider?: 'LOCAL_OCR_AI' | 'GEMINI' | 'OPENAI' | 'ANTHROPIC';
  defaultCurrency?: string;
  sourceFilename?: string;
  pageNumber?: number;
}

/**
 * Intelligent Local Heuristic Parser
 * Parses menu sections, price patterns, variants, and dietary tags without external API.
 */
export function extractMenuHeuristically(
  rawText: string,
  options: ExtractionOptions = {}
): ExtractedMenu {
  const currency = options.defaultCurrency || 'INR';
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);

  const categoriesMap = new Map<string, ExtractedItem[]>();
  let currentCategory = 'Main Menu';

  // Common Section Header Patterns
  const headerRegex = /^(?:---|\*\*\*|###|CATEGORY:)?\s*([A-Za-z0-9 &',/\-—]{2,50})\s*(?:---|\*\*\*|###)?$/;
  // Price patterns: ₹150, Rs. 150, INR 150, $12.50, 150.00, 150/-
  const priceRegex = /(?:₹|Rs\.?|INR|\$|€|£)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:\/[-=])?(?:\s*$|\s+(?:veg|non-veg|vegan|egg)\b)/i;
  // Dietary tags explicit regex
  const vegExplicit = /\b(?:pure veg|vegetarian|\(v\)|\[v\]|🌱|🟢)\b/i;
  const nonVegExplicit = /\b(?:non-veg|non-vegetarian|\(nv\)|\[nv\]|chicken|mutton|prawn|fish|beef|pork|🔴)\b/i;
  const eggExplicit = /\b(?:egg|contains egg|🥚)\b/i;

  let activeItem: Partial<ExtractedItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect section headers (lines that have no price, are all uppercase or short title case, or end with colon)
    const isHeaderLine =
      (line.endsWith(':') ||
        (line.length < 35 && line === line.toUpperCase() && !/\d/.test(line)) ||
        /^==+|^--+|^##+/.test(line)) &&
      !priceRegex.test(line);

    if (isHeaderLine) {
      const cleanHeader = line.replace(/[:#\-=*]/g, '').trim();
      if (cleanHeader.length > 1 && !/^(price|menu|total|item|description|subtotal)$/i.test(cleanHeader)) {
        currentCategory = cleanHeader;
        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        activeItem = null;
        continue;
      }
    }

    // Check if line contains a price or item
    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      // Line with price
      const rawPriceStr = priceMatch[1].replace(',', '.');
      const parsedPrice = parseFloat(rawPriceStr) || 0;

      // Extract item name by removing price substring
      const priceIndex = line.indexOf(priceMatch[0]);
      let itemName = line.substring(0, priceIndex).trim();
      let trailingInfo = line.substring(priceIndex + priceMatch[0].length).trim();

      // Check if item name is on previous line if this line started with price
      if (itemName.length < 2 && activeItem && activeItem.name && activeItem.price === 0) {
        activeItem.price = parsedPrice;
        activeItem.confidence = 0.92;
        continue;
      }

      if (itemName.length >= 2) {
        // If this line is a variant or size option following an active item
        const isVariantLine =
          activeItem &&
          /^(?:regular|large|medium|small|half|full|double|single|pint|pitcher|slice|whole)(?:\s*[\/\-]\s*(?:regular|large|medium|small|half|full|double|single))?/i.test(
            itemName
          );

        if (isVariantLine && activeItem && activeItem.variants) {
          activeItem.variants.push({
            name: itemName.trim(),
            price: parsedPrice,
            isDefault: false,
          });
          continue;
        }

        // If this line is an add-on following an active item (e.g. Extra Shot +₹40)
        const isAddonLine =
          activeItem &&
          /^(?:extra|add|topping|add-on|addon)\b/i.test(itemName);

        if (isAddonLine && activeItem && activeItem.addons) {
          activeItem.addons.push({
            name: itemName.trim(),
            price: parsedPrice,
            groupName: 'Add-ons',
          });
          continue;
        }

        // Detect dietary
        let isVeg: boolean | null = null;
        if (vegExplicit.test(line)) isVeg = true;
        else if (nonVegExplicit.test(line)) isVeg = false;

        // Check for variants in trailing or leading text (e.g. Regular/Large)
        const variants: Array<{ name: string; price: number; isDefault: boolean }> = [];
        if (/half\s*\/\s*full/i.test(line) || /regular\s*\/\s*large/i.test(line)) {
          variants.push({ name: 'Regular', price: parsedPrice, isDefault: true });
        }

        const item: ExtractedItem = {
          name: itemName.replace(/^[-•*–\d.]+\s*/, '').trim(),
          description: trailingInfo.length > 5 ? trailingInfo : null,
          price: parsedPrice,
          currency,
          variants,
          addons: [],
          isVeg,
          isAvailable: true,
          confidence: parsedPrice > 0 ? 0.95 : 0.6,
          sourcePage: options.pageNumber || 1,
          reviewRequired: parsedPrice === 0,
          notes: null,
        };

        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        categoriesMap.get(currentCategory)!.push(item);
        activeItem = item;
      }
    } else {
      // Non-price line: could be description of active item or an unpriced item
      if (activeItem && !activeItem.description && line.length > 10 && line.length < 200) {
        activeItem.description = line;
      } else if (line.length >= 3 && line.length < 60 && !/^[-=*]{3,}$/.test(line)) {
        // Potential item with missing price (flag for review)
        let isVeg: boolean | null = null;
        if (vegExplicit.test(line)) isVeg = true;
        else if (nonVegExplicit.test(line)) isVeg = false;

        const unpricedItem: ExtractedItem = {
          name: line.replace(/^[-•*–\d.]+\s*/, '').trim(),
          description: null,
          price: 0,
          currency,
          variants: [],
          addons: [],
          isVeg,
          isAvailable: true,
          confidence: 0.5,
          sourcePage: options.pageNumber || 1,
          reviewRequired: true,
          notes: 'Price was not detected in original document; please review and set price manually.',
        };

        if (!categoriesMap.has(currentCategory)) {
          categoriesMap.set(currentCategory, []);
        }
        categoriesMap.get(currentCategory)!.push(unpricedItem);
        activeItem = unpricedItem;
      }
    }
  }

  // Format into final structure
  const categories: ExtractedCategory[] = [];
  let sortOrder = 0;

  for (const [catName, items] of categoriesMap.entries()) {
    if (items.length > 0) {
      categories.push({
        name: catName,
        description: null,
        sortOrder: sortOrder++,
        items,
      });
    }
  }

  // If no categories were formed, create a default bucket
  if (categories.length === 0) {
    categories.push({
      name: 'General Menu',
      description: null,
      sortOrder: 0,
      items: [
        {
          name: 'Menu Item (Please Review)',
          description: rawText.substring(0, 100),
          price: 0,
          currency,
          variants: [],
          addons: [],
          isVeg: null,
          isAvailable: true,
          confidence: 0.4,
          sourcePage: 1,
          reviewRequired: true,
          notes: 'Automatic extraction could not identify distinct price tokens.',
        },
      ],
    });
  }

  return {
    menuName: options.sourceFilename ? `Imported: ${options.sourceFilename}` : 'Imported Menu',
    currency,
    categories,
  };
}

/**
 * Gemini AI Extraction Provider
 * Uses Gemini API for high-accuracy multimodal & text menu structuring when API key is configured.
 */
async function extractWithGemini(
  rawText: string,
  options: ExtractionOptions
): Promise<ExtractedMenu> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('CONFIG_ERROR: GEMINI_API_KEY is not configured in environment variables.');
  }

  const prompt = `You are an expert restaurant menu digitization AI.
Analyze the following extracted menu text and structure it into a clean, normalized JSON representation.

STRICT EXTRACTION RULES:
1. ONLY extract information that is explicitly stated in the document.
2. NEVER hallucinate, guess, or invent prices, ingredients, allergens, calories, or dietary tags.
3. If an item price is not clearly listed, set "price": 0 and "reviewRequired": true.
4. Set "isVeg": true ONLY if explicitly marked (Veg, Vegetarian, Green dot, etc.).
   Set "isVeg": false ONLY if explicitly marked (Non-Veg, Red dot, contains meat/chicken/fish).
   Otherwise set "isVeg": null.
5. If variants (e.g. Regular/Large, Half/Full) or add-ons with extra prices are listed, extract them under "variants" and "addons".
6. Return ONLY valid JSON matching this schema:
{
  "menuName": "string",
  "currency": "INR",
  "categories": [
    {
      "name": "string",
      "description": "string or null",
      "sortOrder": 0,
      "items": [
        {
          "name": "string",
          "description": "string or null",
          "price": 150,
          "currency": "INR",
          "variants": [{"name": "string", "price": 150, "isDefault": true}],
          "addons": [{"name": "string", "price": 30, "groupName": "Add-ons"}],
          "isVeg": null,
          "isAvailable": true,
          "confidence": 0.95,
          "sourcePage": 1,
          "reviewRequired": false,
          "notes": null
        }
      ]
    }
  ]
}

Extracted Menu Text:
${rawText.substring(0, 30000)}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textOutput) {
    throw new Error('Gemini API returned an empty extraction result.');
  }

  const parsed = JSON.parse(textOutput);
  return ExtractedMenuSchema.parse(parsed);
}

/**
 * Universal Extraction Dispatcher
 */
export async function extractMenu(
  rawText: string,
  options: ExtractionOptions = {}
): Promise<ExtractedMenu> {
  const provider = options.provider || 'LOCAL_OCR_AI';

  if (provider === 'GEMINI') {
    try {
      return await extractWithGemini(rawText, options);
    } catch (err: any) {
      console.warn(`[AI Importer] Gemini extraction failed: ${err.message}. Falling back to intelligent local parser.`);
      return extractMenuHeuristically(rawText, options);
    }
  }

  // Fallback or default: Intelligent Local AI Heuristic Parser
  return extractMenuHeuristically(rawText, options);
}
