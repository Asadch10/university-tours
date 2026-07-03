// Local-disk image uploads for admin-managed media (university banners/logos, etc.).
// Files are written to <backend>/uploads and served statically at /uploads/<file>.
// Swappable for S3/Cloudinary later — only this module and the static mount change.
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from './http.js';

/** Absolute path to the uploads directory (created on boot if missing). */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

/** Public URL prefix the uploads are served under. */
export const UPLOAD_URL_PREFIX = '/uploads';

if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const id = randomBytes(12).toString('hex');
    cb(null, `${id}${EXT[file.mimetype] ?? path.extname(file.originalname) ?? ''}`);
  },
});

/** Single-file image upload (field name `file`), max 5 MB, images only. */
export const imageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new HttpError(400, 'invalid_file_type', 'Only JPG, PNG, WebP, GIF, or SVG images are allowed'));
      return;
    }
    cb(null, true);
  },
}).single('file');

/** Public URL for a stored filename. */
export function uploadUrl(filename: string): string {
  return `${UPLOAD_URL_PREFIX}/${filename}`;
}
