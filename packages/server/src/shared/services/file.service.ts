import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
const AADHAAR_DIR = path.join(UPLOAD_DIR, 'aadhaar');
const PHOTOS_DIR = path.join(UPLOAD_DIR, 'photos');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function ensureDirs() {
  for (const dir of [UPLOAD_DIR, AADHAAR_DIR, PHOTOS_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function getEncryptionKey(): Buffer {
  const key = process.env.AADHAAR_ENCRYPTION_KEY;
  if (!key) throw new Error('AADHAAR_ENCRYPTION_KEY environment variable is required');
  return Buffer.from(key, 'hex');
}

export function validateFile(
  file: { mimetype: string; size: number },
  type: 'aadhaar' | 'photo'
) {
  const allowedTypes = type === 'aadhaar' ? ALLOWED_IMAGE_TYPES : ALLOWED_PHOTO_TYPES;
  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }
}

export async function saveAadhaarPhoto(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  ensureDirs();
  const ext = path.extname(originalName);
  const key = `aadhaar_${crypto.randomUUID()}${ext}.enc`;
  const filePath = path.join(AADHAAR_DIR, key);

  const encKey = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

  fs.writeFileSync(filePath, encrypted);
  return key;
}

export async function getAadhaarPhoto(fileKey: string): Promise<Buffer> {
  const filePath = path.join(AADHAAR_DIR, fileKey);
  if (!fs.existsSync(filePath)) throw new Error('File not found');

  const data = fs.readFileSync(filePath);
  const encKey = getEncryptionKey();
  const iv = data.subarray(0, 16);
  const encrypted = data.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function savePersonPhoto(
  buffer: Buffer,
  originalName: string
): Promise<string> {
  ensureDirs();
  const ext = path.extname(originalName);
  const key = `photo_${crypto.randomUUID()}${ext}`;
  const filePath = path.join(PHOTOS_DIR, key);
  fs.writeFileSync(filePath, buffer);
  return key;
}

export function getPersonPhotoPath(fileKey: string): string {
  return path.join(PHOTOS_DIR, fileKey);
}
