import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), 'private-storage', 'menu-imports');

export function ensureStorageDir(importId: string): string {
  const targetDir = path.join(STORAGE_ROOT, importId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function saveImportFile(
  importId: string,
  filename: string,
  buffer: Buffer
): Promise<{ storageKey: string; absolutePath: string }> {
  const dir = ensureStorageDir(importId);
  const cleanName = `${Date.now()}_${sanitizeFilename(filename)}`;
  const absolutePath = path.join(dir, cleanName);

  // Guard against path traversal
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new Error('SECURITY_ERROR: Path traversal detected in filename.');
  }

  await fs.promises.writeFile(absolutePath, buffer);
  const storageKey = path.relative(STORAGE_ROOT, absolutePath);

  return { storageKey, absolutePath };
}

export async function readImportFile(storageKey: string): Promise<Buffer> {
  const absolutePath = path.join(STORAGE_ROOT, storageKey);
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new Error('SECURITY_ERROR: Path traversal detected.');
  }
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found in storage: ${storageKey}`);
  }
  return fs.promises.readFile(absolutePath);
}

export function getImportFileAbsolutePath(storageKey: string): string {
  const absolutePath = path.join(STORAGE_ROOT, storageKey);
  if (!absolutePath.startsWith(STORAGE_ROOT)) {
    throw new Error('SECURITY_ERROR: Path traversal detected.');
  }
  return absolutePath;
}

export async function deleteImportFiles(importId: string): Promise<void> {
  const targetDir = path.join(STORAGE_ROOT, importId);
  if (targetDir.startsWith(STORAGE_ROOT) && fs.existsSync(targetDir)) {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
  }
}
