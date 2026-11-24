# AI Menu Importer & Automatic Digital Menu Generator — Product Architecture & Technical Specification

## 1. Executive Summary

The **AI Menu Importer & Automatic Digital Menu Generator** is an enterprise-grade document ingestion and menu digitization subsystem integrated into the **Nord Cafe** multi-tenant SaaS platform.

It allows **Super Admin**, **Admin Staff**, **Cafe Owners**, and authorized **Cafe Managers** to upload restaurant menus in any supported document or photo format (PDF, DOCX, XLSX, XLS, CSV, JPG, PNG, WEBP). The system parses documents, runs OCR where needed, applies AI structured extraction, detects sections, dishes, variants, prices, and dietary tags, provides a side-by-side review studio, performs live duplicate detection, and commits verified items to production digital menus via atomic database transactions.

---

## 2. System Architecture & Ingestion Pipeline

```
[UPLOAD INTERFACE]
  │ (Multipart upload with Magic Bytes validation)
  ▼
[PRIVATE STORAGE & CHECKSUM]
  │ (SHA-256 hash, path traversal guard: private-storage/menu-imports/<id>)
  ▼
[DOCUMENT & OCR PARSER]
  ├─ Digital PDF: pdf-parse text stream & page segmenter
  ├─ Word: mammoth.extractRawText
  ├─ Spreadsheets: SheetJS (xlsx, xls, csv)
  └─ Images & Scans: Tesseract OCR WASM worker
  ▼
[AI EXTRACTION ENGINE]
  ├─ Pluggable Provider: Gemini 1.5 Flash / OpenAI / Local Heuristic Parser
  ├─ Strict Rules: Zero price/allergen hallucination, explicit veg tagging
  └─ Zod Validation: Normalized ExtractedMenuSchema
  ▼
[DRAFT INGESTION IN POSTGRESQL]
  │ (MenuImportCategory, MenuImportItem, MenuImportVariant, MenuImportAddon)
  ▼
[DEDICATED REVIEW STUDIO]
  ├─ Side-by-side source document viewer (PDF/Image cross-referencing)
  ├─ Category sidebar & product editor with confidence indicators
  ├─ Duplicate Detection Engine (fuzzy string matching against live menu)
  └─ Mobile customer preview simulation
  ▼
[ATOMIC DATABASE PUBLISHING TRANSACTION]
  │ (prisma.$transaction commits items into live Category & MenuItem models)
  ▼
[LIVE CUSTOMER DIGITAL MENU & KDS IMMEDIATE REFLECTION]
```

---

## 3. Supported File Formats & Signature Validation

Files are validated using **magic bytes (file signatures)** to prevent file spoofing, executable uploads, or corrupted files:

| File Format | Extensions | Magic Byte Signature | Ingestion Method |
| :--- | :--- | :--- | :--- |
| **Digital PDF** | `.pdf` | `25 50 44 46` (`%PDF`) | `pdf-parse` v2 native stream extraction |
| **Scanned PDF** | `.pdf` | `25 50 44 46` (`%PDF`) | Flagged if selectable text < 40 chars/page; routed to OCR |
| **Word Document** | `.docx` | `50 4B 03 04` (ZIP container) | `mammoth` XML text parser |
| **Excel Workbook** | `.xlsx` | `50 4B 03 04` (ZIP container) | SheetJS workbook cell extraction |
| **Legacy Excel** | `.xls` | `D0 CF 11 E0 A1 B1 1A E1` | SheetJS binary workbook parser |
| **CSV Sheet** | `.csv` | UTF-8 validated text stream | PapaParse header & delimiter detector |
| **Images / Photos** | `.jpg`, `.jpeg`, `.png`, `.webp` | JPEG (`FF D8 FF`), PNG (`89 50 4E 47`), WEBP (`RIFF..WEBP`) | Tesseract OCR engine (or Gemini Vision) |

---

## 4. Database Schema Design (Prisma)

```prisma
model MenuImport {
  id                 String               @id @default(uuid())
  cafeId             String
  branchId           String?
  uploadedBy         String
  menuName           String
  status             String               @default("PENDING") // PENDING, PROCESSING, COMPLETED, FAILED, PUBLISHED, ARCHIVED
  processingProgress Int                  @default(0) // 0 to 100
  currency           String               @default("INR")
  notes              String?
  language           String?              @default("en")
  errorMessage       String?
  totalItems         Int                  @default(0)
  totalCategories    Int                  @default(0)
  publishedAt        DateTime?
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  cafe               Cafe                 @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  branch             Branch?              @relation(fields: [branchId], references: [id], onDelete: SetNull)
  user               User                 @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  files              MenuImportFile[]
  jobs               MenuImportJob[]
  categories         MenuImportCategory[]
  items              MenuImportItem[]
  auditLogs          MenuImportAuditLog[]
}

model MenuImportFile {
  id               String      @id @default(uuid())
  importId         String
  originalFilename String
  storageKey       String
  mimeType         String
  fileSize         Int
  pageCount        Int         @default(1)
  checksum         String
  processingStatus String      @default("PENDING")
  extractedText    String?
  errorMessage     String?
  createdAt        DateTime    @default(now())

  import           MenuImport  @relation(fields: [importId], references: [id], onDelete: Cascade)
}

model MenuImportCategory {
  id           String           @id @default(uuid())
  importId     String
  name         String
  description  String?
  sortOrder    Int              @default(0)
  reviewStatus String           @default("PENDING_REVIEW")
  createdAt    DateTime         @default(now())

  import       MenuImport       @relation(fields: [importId], references: [id], onDelete: Cascade)
  items        MenuImportItem[]
}

model MenuImportItem {
  id                 String               @id @default(uuid())
  importId           String
  importCategoryId   String
  name               String
  description        String?
  extractedPrice     Float
  currency           String               @default("INR")
  confidence         Float                @default(1.0)
  sourcePage         Int                  @default(1)
  sourceFile         String?
  reviewStatus       String               @default("PENDING_REVIEW")
  reviewRequired     Boolean              @default(false)
  manuallyEdited     Boolean              @default(false)
  isVeg              Boolean?
  foodType           String?              @default("VEG")
  isAvailable        Boolean              @default(true)
  preparationMinutes Int?                 @default(15)
  isBestseller       Boolean              @default(false)
  matchedItemId      String?
  duplicateAction    String?              @default("IMPORT_AS_NEW") // IMPORT_AS_NEW, UPDATE_EXISTING, SKIP
  createdAt          DateTime             @default(now())
  updatedAt          DateTime             @updatedAt

  import             MenuImport           @relation(fields: [importId], references: [id], onDelete: Cascade)
  category           MenuImportCategory   @relation(fields: [importCategoryId], references: [id], onDelete: Cascade)
  variants           MenuImportVariant[]
  addons             MenuImportAddon[]
}
```

---

## 5. Strict Extraction & Non-Hallucination Rules

The extraction engine operates under strict commercial safeguards:

1. **Zero Price Hallucination**: If a price is omitted, cut off, or illegible in the source document, the parser sets `price: 0` and `reviewRequired: true`. It never invents placeholder numbers.
2. **Explicit Dietary Classification**: The system flags items as `isVeg: true` or `isVeg: false` ONLY when explicit markings (green dot, veg label, chicken/meat ingredients) appear. Unspecified items default to `isVeg: null` for owner review.
3. **Variant & Addon Preservation**: Size variants (e.g., *Regular / Large*, *Half / Full*) and add-ons (*Extra Espresso Shot +₹40*) are linked directly to their parent product rather than treated as orphaned dishes.
4. **Confidence Rating**: Every extracted entity receives a confidence coefficient (0.0 to 1.0) based on character recognition clarity and price token certainty. Items below 0.8 are flagged with an amber "Needs Review" badge.

---

## 6. Duplicate Detection & Publishing Workflow

Before committing imported items into live restaurant operations:

1. **Fuzzy String Matching**: The system compares extracted dish names against live `MenuItem` records in PostgreSQL using normalized token overlap and string similarity.
2. **Action Recommendation**:
   - `SKIP`: If a dish matches an existing menu item with the same name and price.
   - `UPDATE_EXISTING`: If a dish matches an existing item name but the price or description has changed.
   - `IMPORT_AS_NEW`: If the dish is unique.
3. **Atomic Database Transaction (`prisma.$transaction`)**:
   - Commits categories and menu items in a single atomic transaction.
   - Links variants and add-on groups.
   - Updates `MenuImport.status = 'PUBLISHED'` and sets `publishedAt = NOW()`.
   - Generates an immutable `MenuImportAuditLog` entry.

---

## 7. Versioned API Inventory

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/menu-imports` | Create import session | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/files` | Multipart upload with magic byte verification | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/process` | Kick off async document extraction | Super Admin, Admin Staff, Cafe Owner, Manager |
| `GET` | `/api/v1/menu-imports` | List import sessions with filters & pagination | Super Admin, Admin Staff, Cafe Owner, Manager |
| `GET` | `/api/v1/menu-imports/:id` | Get import metadata & files | Super Admin, Admin Staff, Cafe Owner, Manager |
| `GET` | `/api/v1/menu-imports/:id/status` | Lightweight progress polling endpoint | Super Admin, Admin Staff, Cafe Owner, Manager |
| `GET` | `/api/v1/menu-imports/:id/preview` | Full extracted menu hierarchy & stats | Super Admin, Admin Staff, Cafe Owner, Manager |
| `GET` | `/api/v1/menu-imports/:id/files/:fileId` | Secure authenticated file streaming | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/categories` | Add manual category | Super Admin, Admin Staff, Cafe Owner, Manager |
| `PATCH` | `/api/v1/menu-imports/:id/categories/:catId` | Edit category name/order | Super Admin, Admin Staff, Cafe Owner, Manager |
| `DELETE` | `/api/v1/menu-imports/:id/categories/:catId` | Delete category & items | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/items` | Add manual product | Super Admin, Admin Staff, Cafe Owner, Manager |
| `PATCH` | `/api/v1/menu-imports/:id/items/:itemId` | Edit extracted product | Super Admin, Admin Staff, Cafe Owner, Manager |
| `DELETE` | `/api/v1/menu-imports/:id/items/:itemId` | Delete product | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/duplicates` | Run duplicate detection against live menu | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/validate` | Validate menu structure before publishing | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/publish` | Atomically commit menu into live tables | Super Admin, Admin Staff, Cafe Owner, Manager |
| `POST` | `/api/v1/menu-imports/:id/retry` | Re-run document extraction | Super Admin, Admin Staff, Cafe Owner, Manager |
| `DELETE` | `/api/v1/menu-imports/:id` | Delete import session & disk files | Super Admin, Admin Staff, Cafe Owner |
| `GET` | `/api/v1/admin/importer-settings` | Super Admin global engine configuration | Super Admin |
| `PATCH` | `/api/v1/admin/importer-settings` | Update quotas, providers & format rules | Super Admin |

---

## 8. Automated Verification Results

All 11 unit and integration test suites pass in `tests/platform.test.ts` and `tests/ai-importer.test.ts`:

```
> nord-cafe@1.0.0 test
> tsx --test tests/platform.test.ts tests/ai-importer.test.ts

▶ AI Menu Importer & Document Ingestion Test Suite
  ✔ 1. File Signature Validation & Security Rejection (3.95ms)
  ✔ 2. Multi-Format Document Parsing Engine (7.40ms)
  ✔ 3. AI Menu Extraction, Categories, Prices & Strict Non-Hallucination (0.92ms)
  ✔ 4. Full Lifecycle: Session -> Items -> Duplicate Detection -> Publishing Transaction (29.60ms)
  ✔ 5. Tenant Isolation & Cross-Cafe Guarding (1.48ms)
✔ AI Menu Importer & Document Ingestion Test Suite (43.95ms)

▶ Nord Cafe Production Test Suite
  ✔ 1. Tenant Isolation & Database Integrity (13.96ms)
  ✔ 2. Authentication, Hashing & JWT Security (157.52ms)
  ✔ 3. Currency & Order Utilities (7.48ms)
  ✔ 4. QR Code Engine Generation (13.61ms)
  ✔ 5. Razorpay Signature Verification & Security (0.12ms)
  ✔ 6. Subscription Plans and Entitlements in Postgres (1.49ms)
✔ Nord Cafe Production Test Suite (194.86ms)

ℹ tests 11
ℹ suites 2
ℹ pass 11
ℹ fail 0
```
