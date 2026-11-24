// @ts-ignore
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { createWorker } from 'tesseract.js';

export interface ParsedDocumentResult {
  text: string;
  pageCount: number;
  isScannedOrImage: boolean;
  metadata?: Record<string, any>;
  structuredRows?: Array<Record<string, string>>;
}

/**
 * Extracts plain text and metadata from digital documents and images.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
  extension: string
): Promise<ParsedDocumentResult> {
  const ext = extension.toLowerCase();

  // 1. PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    try {
      const parser = new PDFParse({ data: buffer });
      const textResult = await parser.getText();
      const text = textResult && textResult.text ? textResult.text.trim() : '';
      const pageCount = (textResult && textResult.total) || 1;

      // Check if scanned PDF (very little or no selectable text)
      const isScanned = text.length < 40 * pageCount;

      return {
        text,
        pageCount,
        isScannedOrImage: isScanned,
      };
    } catch (err: any) {
      console.error('PDF parsing error:', err);
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }
  }

  // 2. Microsoft Word (DOCX)
  if (ext === 'docx' || mimeType.includes('wordprocessingml')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ? result.value.trim() : '';
      return {
        text,
        pageCount: 1,
        isScannedOrImage: false,
        metadata: { messages: result.messages },
      };
    } catch (err: any) {
      console.error('DOCX parsing error:', err);
      throw new Error(`Failed to parse DOCX document: ${err.message}`);
    }
  }

  // 3. Microsoft Excel (XLSX, XLS)
  if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      let combinedText = '';
      const allRows: Array<Record<string, string>> = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;

        combinedText += `\n--- SHEET: ${sheetName} ---\n`;
        const csv = XLSX.utils.sheet_to_csv(sheet);
        combinedText += csv + '\n';

        const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
        for (const row of jsonRows) {
          const stringRow: Record<string, string> = {};
          for (const [k, v] of Object.entries(row)) {
            stringRow[k] = String(v).trim();
          }
          allRows.push(stringRow);
        }
      }

      return {
        text: combinedText.trim(),
        pageCount: workbook.SheetNames.length,
        isScannedOrImage: false,
        structuredRows: allRows,
      };
    } catch (err: any) {
      console.error('Excel parsing error:', err);
      throw new Error(`Failed to parse Excel spreadsheet: ${err.message}`);
    }
  }

  // 4. CSV
  if (ext === 'csv' || mimeType === 'text/csv' || mimeType === 'text/plain') {
    try {
      const content = buffer.toString('utf-8');
      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      const rows = (parsed.data || []) as Array<Record<string, string>>;

      return {
        text: content,
        pageCount: 1,
        isScannedOrImage: false,
        structuredRows: rows,
      };
    } catch (err: any) {
      console.error('CSV parsing error:', err);
      throw new Error(`Failed to parse CSV file: ${err.message}`);
    }
  }

  // 5. Images (JPG, PNG, WEBP) via Tesseract OCR
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mimeType.startsWith('image/')) {
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(buffer);
      await worker.terminate();

      return {
        text: ret.data.text ? ret.data.text.trim() : '',
        pageCount: 1,
        isScannedOrImage: true,
        metadata: {
          confidence: ret.data.confidence,
        },
      };
    } catch (err: any) {
      console.error('OCR processing error:', err);
      throw new Error(`Failed to run OCR on image: ${err.message}`);
    }
  }

  throw new Error(`Unsupported document type: ${ext} (${mimeType})`);
}
