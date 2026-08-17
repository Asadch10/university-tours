// Local-disk image uploads for admin-managed media (university banners/logos, etc.).
// Files are written to <backend>/uploads and served statically at /uploads/<file>.
// Swappable for S3/Cloudinary later — only this module and the static mount change.
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { HttpError } from './http.js';
import { logger } from './logger.js';

/** Absolute path to the uploads directory (created on boot if missing). */
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

/** Longest edge kept when re-encoding. Nothing on the site renders larger than this. */
const MAX_IMAGE_EDGE = 1600;

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

/**
 * Downscale and re-encode an uploaded image in place.
 *
 * Files were previously stored exactly as received — up to the 5 MB limit, at whatever
 * dimensions the camera or screenshot produced. Nothing on the site displays an image
 * larger than ~1600px, so a 4000px 2.3 MB PNG was being sent in full to fill an 80x64
 * thumbnail.
 *
 * Re-encoding to WebP at a sane bound typically cuts these by 80–95% with no visible
 * difference. Best-effort: if processing fails for any reason the original file is
 * kept, so an upload can never be lost to an encoder error.
 *
 * Returns the filename to store — the `.webp` one when conversion succeeded.
 */
export async function optimizeUpload(filename: string): Promise<string> {
  const src = path.join(UPLOAD_DIR, filename);
  // SVG is vector — rasterising it would make it worse, and GIF may be animated,
  // which a still re-encode would silently flatten.
  if (/\.(svg|gif)$/i.test(filename)) return filename;

  const out = `${filename.replace(/\.[^.]+$/, '')}.webp`;
  const dest = path.join(UPLOAD_DIR, out);

  try {
    const { default: sharp } = await import('sharp');
    await sharp(src)
      .rotate() // honour EXIF orientation before the metadata is stripped
      .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dest);

    // Only adopt the result if it's actually smaller — a small, already-optimised
    // JPEG can come out bigger as WebP.
    const [before, after] = [statSync(src).size, statSync(dest).size];
    if (after >= before) {
      unlinkSync(dest);
      return filename;
    }
    unlinkSync(src);
    return out;
  } catch (err) {
    logger.warn({ err, filename }, 'Image optimisation failed — storing the original');
    try {
      if (existsSync(dest)) unlinkSync(dest);
    } catch {
      /* nothing more to do */
    }
    return filename;
  }
}
