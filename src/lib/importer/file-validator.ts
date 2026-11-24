import crypto from 'crypto';

export interface FileValidationResult {
  isValid: boolean;
  detectedMime: string;
  detectedExtension: string;
  error?: string;
  isDocument: boolean;
  isImage: boolean;
}

// Magic bytes signatures
const SIGNATURES = [
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/webp', ext: 'webp', check: (b: Buffer) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  // ZIP-based Office formats: docx, xlsx
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: 'xlsx', bytes: [0x50, 0x4b, 0x03, 0x04] },
  // Legacy XLS
  { mime: 'application/vnd.ms-excel', ext: 'xls', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
];

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'docx', 'xlsx', 'xls', 'csv'];
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Validates file signature, mime type, extension and size.
 * Rejects executables, scripts, and spoofed files.
 */
export function validateUploadedFile(buffer: Buffer, originalFilename: string): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      detectedMime: 'application/octet-stream',
      detectedExtension: '',
      error: 'Uploaded file is empty',
      isDocument: false,
      isImage: false,
    };
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      detectedMime: 'application/octet-stream',
      detectedExtension: '',
      error: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 25MB`,
      isDocument: false,
      isImage: false,
    };
  }

  const rawExt = originalFilename.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(rawExt)) {
    return {
      isValid: false,
      detectedMime: 'application/octet-stream',
      detectedExtension: rawExt,
      error: `Unsupported file extension .${rawExt}. Supported: PDF, JPG, PNG, WEBP, DOCX, XLSX, XLS, CSV.`,
      isDocument: false,
      isImage: false,
    };
  }

  // Check CSV (Text format without binary magic bytes)
  if (rawExt === 'csv') {
    // Check if valid UTF-8 text without null bytes
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
    let hasNull = false;
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] === 0x00) {
        hasNull = true;
        break;
      }
    }
    if (hasNull) {
      return {
        isValid: false,
        detectedMime: 'application/octet-stream',
        detectedExtension: 'csv',
        error: 'File claims to be CSV but contains binary null bytes (potential executable or corrupted file)',
        isDocument: true,
        isImage: false,
      };
    }
    return {
      isValid: true,
      detectedMime: 'text/csv',
      detectedExtension: 'csv',
      isDocument: true,
      isImage: false,
    };
  }

  // Check binary magic bytes
  for (const sig of SIGNATURES) {
    if (sig.check && sig.check(buffer)) {
      const isImg = sig.mime.startsWith('image/');
      return {
        isValid: true,
        detectedMime: sig.mime,
        detectedExtension: sig.ext || rawExt,
        isDocument: !isImg,
        isImage: isImg,
      };
    }

    if (sig.bytes) {
      let match = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[i] !== sig.bytes[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        // Disambiguate ZIP containers (docx vs xlsx)
        let resolvedMime = sig.mime;
        let resolvedExt = sig.ext || rawExt;

        if (sig.bytes[0] === 0x50 && sig.bytes[1] === 0x4b) {
          if (rawExt === 'xlsx') {
            resolvedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            resolvedExt = 'xlsx';
          } else if (rawExt === 'docx') {
            resolvedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            resolvedExt = 'docx';
          }
        }

        const isImg = resolvedMime.startsWith('image/');
        return {
          isValid: true,
          detectedMime: resolvedMime,
          detectedExtension: resolvedExt,
          isDocument: !isImg,
          isImage: isImg,
        };
      }
    }
  }

  return {
    isValid: false,
    detectedMime: 'application/octet-stream',
    detectedExtension: rawExt,
    error: `File signature mismatch for .${rawExt}. The file contents do not match its declared format.`,
    isDocument: false,
    isImage: false,
  };
}

export function computeFileChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
