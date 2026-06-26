import { BadRequestException } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';

const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function getUploadRoot(): string {
  const configured = process.env.UPLOAD_DIR ?? './uploads';
  return resolve(process.cwd(), configured);
}

export function getMaxUploadBytes(): number {
  const maxMb = Number(process.env.MAX_FILE_SIZE_MB ?? 10);
  return maxMb * 1024 * 1024;
}

export function assertImageFile(file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('File is required');
  }

  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException('Only image files (JPEG, PNG, WEBP, GIF) are allowed');
  }

  if (file.size > getMaxUploadBytes()) {
    throw new BadRequestException(`File exceeds ${process.env.MAX_FILE_SIZE_MB ?? 10}MB limit`);
  }
}

export async function saveUploadedImage(
  scope: string,
  ownerId: string,
  file: Express.Multer.File,
): Promise<{ storedName: string; fileUrl: string; diskPath: string }> {
  assertImageFile(file);

  const ext = extname(file.originalname).toLowerCase() || '.jpg';
  const storedName = `${randomUUID()}${ext}`;
  const dir = join(getUploadRoot(), scope, ownerId);
  await mkdir(dir, { recursive: true });

  const diskPath = join(dir, storedName);
  await writeFile(diskPath, file.buffer);

  return {
    storedName,
    diskPath,
    fileUrl: `/uploads/${scope}/${ownerId}/${storedName}`,
  };
}

export async function deleteStoredFile(fileUrl: string) {
  const prefix = '/uploads/';
  if (!fileUrl.startsWith(prefix)) return;

  const relativePath = fileUrl.slice(prefix.length);
  const diskPath = join(getUploadRoot(), relativePath);

  try {
    await unlink(diskPath);
  } catch {
    // Ignore missing files on disk.
  }
}
