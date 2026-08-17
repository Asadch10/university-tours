/**
 * One-off: downscale every already-stored upload in place.
 *
 * Files uploaded before optimisation was added are kept at their original dimensions
 * — some are 5000px wide and several megabytes, served in full to fill an 80x64
 * thumbnail.
 *
 * Deliberately re-encodes to the SAME format under the SAME filename, so every URL
 * already saved in profileJson keeps resolving. (New uploads convert to WebP, which
 * is smaller still, but that changes the extension and so can't be applied
 * retroactively without rewriting stored URLs.)
 *
 * Safe to run repeatedly: anything already within bounds is skipped, and a file is
 * only replaced when the result is actually smaller.
 *
 *   node scripts/optimize-existing-uploads.mjs [--apply]
 */
import { readdirSync, statSync, renameSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIR = path.resolve(process.cwd(), 'uploads');
const MAX_EDGE = 1600;
const APPLY = process.argv.includes('--apply');

const mb = (n) => (n / 1048576).toFixed(2) + 'MB';
let before = 0, after = 0, changed = 0, skipped = 0;

for (const file of readdirSync(DIR)) {
  // Vector and (possibly animated) GIF are left alone.
  if (!/\.(jpe?g|png|webp)$/i.test(file)) { skipped++; continue; }

  const src = path.join(DIR, file);
  const size = statSync(src).size;
  let meta;
  try { meta = await sharp(src).metadata(); } catch { skipped++; continue; }

  if ((meta.width ?? 0) <= MAX_EDGE && (meta.height ?? 0) <= MAX_EDGE && size < 400_000) {
    before += size; after += size; skipped++;
    continue;
  }

  const ext = file.split('.').pop().toLowerCase();
  const tmp = path.join(DIR, `.opt-${file}`);
  try {
    const p = sharp(src).rotate().resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
    await (ext === 'png' ? p.png({ compressionLevel: 9, palette: true })
         : ext === 'webp' ? p.webp({ quality: 82 })
         : p.jpeg({ quality: 82, mozjpeg: true })).toFile(tmp);

    const newSize = statSync(tmp).size;
    if (newSize >= size) { unlinkSync(tmp); before += size; after += size; skipped++; continue; }

    console.log(`  ${file}  ${meta.width}x${meta.height}  ${mb(size)} -> ${mb(newSize)}`);
    before += size; after += newSize; changed++;
    if (APPLY) renameSync(tmp, src); else unlinkSync(tmp);
  } catch (err) {
    try { unlinkSync(tmp); } catch {}
    console.log(`  SKIP ${file}: ${err.message}`);
    before += size; after += size; skipped++;
  }
}

console.log(`\n${APPLY ? '' : 'DRY RUN — '}${changed} file(s) to shrink, ${skipped} left as-is`);
console.log(`total ${mb(before)} -> ${mb(after)}  (${before ? (100 - after / before * 100).toFixed(0) : 0}% smaller)`);
if (!APPLY) console.log('re-run with --apply to write the changes');
