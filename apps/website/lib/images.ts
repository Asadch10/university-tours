/**
 * Site photography — one catalog so every page pulls from the same vetted set.
 *
 * All files are **self-hosted** in `public/photos/`, deliberately not hotlinked. Several
 * pages previously loaded images straight from other companies' CDNs
 * (sharetribe-assets.imgix.net, schoolscoops.s3), which can be revoked or deleted at any
 * time and carries a licensing problem. Anything added here must be a file we own or hold
 * a commercial licence for.
 *
 * Source: Unsplash (Unsplash Licence — free for commercial use, no attribution required).
 * Photographer credits are kept below as a courtesy and as a record of provenance.
 *
 * Originals are 3–7 MB at up to 6000px; they are downscaled to ≤1920px and served as
 * WebP at quality 78, which took the set from 24 MB to ~1.1 MB. Re-run that step for
 * anything new — add the .webp, not the .jpg, or the saving is lost.
 */

export interface SitePhoto {
  /** Path under public/ — always self-hosted. */
  src: string;
  /** Meaningful alt text; empty string only for purely decorative use. */
  alt: string;
  /** Photographer, for provenance. */
  credit: string;
  /** True when the image is taller than it is wide — avoid wide banner slots. */
  portrait?: boolean;
}

export const PHOTOS = {
  /** Two people reviewing an application together at a desk. */
  consultation: {
    src: '/photos/consultation.webp',
    alt: 'An adviser and a student reviewing an application together',
    credit: 'Amy Hirschi',
  },
  /** Warm, low-lit library — reads especially well on the dark theme. */
  library: {
    src: '/photos/library.webp',
    alt: 'A quiet university library with reading chairs',
    credit: 'Denise Jans',
  },
  /** Five students walking together past brick buildings. */
  studentsGroup: {
    src: '/photos/students-group.webp',
    alt: 'A group of students walking together near campus',
    credit: 'Eliott Reyna',
  },
  /** Group walking at golden hour, shot from behind. */
  groupTours: {
    src: '/photos/group-tours.webp',
    alt: 'A group walking together at golden hour',
    credit: 'Luke Porter',
  },
  /** Students with backpacks crossing campus. Portrait — use in cards, not banners. */
  campusTour: {
    src: '/photos/campus-tour.webp',
    alt: 'Students with backpacks walking across a university campus',
    credit: 'Meredith Spencer',
    portrait: true,
  },
  /** University buildings across a reflecting pond. */
  campusExterior: {
    src: '/photos/campus-exterior.webp',
    alt: 'University buildings reflected in a campus pond',
    credit: 'Arinal Izzah',
  },
} satisfies Record<string, SitePhoto>;

export type PhotoKey = keyof typeof PHOTOS;
