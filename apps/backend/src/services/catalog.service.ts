import { prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';
import { getPriceBounds as adminGetPriceBounds } from './admin.service.js';

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function listSchools(q?: string) {
  return prisma.school.findMany({
    where: {
      enabled: true,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { _count: { select: { listings: true, sellerProfiles: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function autocompleteSchools(q: string) {
  return prisma.school.findMany({
    where: { enabled: true, name: { contains: q } },
    select: { id: true, name: true, slug: true, location: true },
    orderBy: { name: 'asc' },
    take: 10,
  });
}

export async function getSchoolBySlug(slug: string) {
  const school = await prisma.school.findUnique({
    where: { slug },
    include: {
      _count: { select: { listings: true, sellerProfiles: true } },
      listings: {
        where: { status: 'ACTIVE' },
        include: { options: true, _count: { select: { bookings: true } } },
        take: 20,
      },
    },
  });
  if (!school) throw new HttpError(404, 'not_found', 'School not found');
  return school;
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export async function getListing(id: string) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      school: true,
      options: true,
      _count: { select: { bookings: true } },
    },
  });
  if (!listing) throw new HttpError(404, 'not_found', 'Listing not found');
  return listing;
}

export async function createListing(sellerId: string, data: {
  schoolId: string;
  serviceType: string;
  title: string;
  description?: string;
  options: { durationMinutes: number; priceCents: number; label?: string }[];
}) {
  const seller = await prisma.sellerProfile.findUnique({ where: { userId: sellerId } });
  if (!seller || seller.applicationStatus !== 'APPROVED') {
    throw new HttpError(403, 'not_approved', 'Seller must be approved to create listings');
  }
  const bounds = await prisma.servicePriceBound.findUnique({ where: { serviceType: data.serviceType as never } });
  if (bounds) {
    for (const opt of data.options) {
      if (opt.priceCents < bounds.minCents || opt.priceCents > bounds.maxCents) {
        throw new HttpError(400, 'price_out_of_bounds', `Price must be between $${bounds.minCents / 100} and $${bounds.maxCents / 100}`);
      }
    }
  }
  return prisma.listing.create({
    data: {
      sellerId,
      schoolId: data.schoolId,
      serviceType: data.serviceType as never,
      title: data.title,
      description: data.description,
      status: 'DRAFT',
      options: { create: data.options },
    },
    include: { options: true, school: true },
  });
}

export async function updateListing(id: string, sellerId: string, data: {
  title?: string;
  description?: string;
}) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'not_found', 'Listing not found');
  if (listing.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your listing');
  return prisma.listing.update({ where: { id }, data, include: { options: true } });
}

export async function setListingStatus(id: string, sellerId: string, status: 'ACTIVE' | 'PAUSED') {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'not_found', 'Listing not found');
  if (listing.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your listing');
  if (listing.status === 'SUSPENDED') throw new HttpError(409, 'suspended', 'Listing is suspended by admin');
  return prisma.listing.update({ where: { id }, data: { status } });
}

export async function deleteListing(id: string, sellerId: string) {
  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) throw new HttpError(404, 'not_found', 'Listing not found');
  if (listing.sellerId !== sellerId) throw new HttpError(403, 'forbidden', 'Not your listing');
  const hasBookings = await prisma.booking.count({ where: { listingId: id, status: { in: ['PENDING', 'CONFIRMED'] } } });
  if (hasBookings) throw new HttpError(409, 'has_active_bookings', 'Cannot delete listing with active bookings');
  await prisma.listing.delete({ where: { id } });
  return { ok: true };
}

// ─── Search / guide discovery ─────────────────────────────────────────────────

export async function searchGuides(opts: {
  schoolId?: string;
  serviceType?: string;
  date?: string;
  q?: string;
  page?: number;
  limit?: number;
}) {
  const { schoolId, serviceType, q, page = 1, limit = 20 } = opts;
  const where: Record<string, unknown> = { status: 'ACTIVE' };
  if (schoolId) where.schoolId = schoolId;
  if (serviceType) where.serviceType = serviceType;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        school: true,
        options: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { id: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);
  return { data, total, page, limit };
}

// ─── Price bounds (public read for UI validation) ─────────────────────────────

/**
 * Public pricing for the guest booking widget.
 *
 * Delegates to the admin service so the guest-facing prices are exactly what the console
 * shows — including the defaults it fills in for a service type with no row yet. Querying
 * the table directly here would silently omit CONSULTATION on any database seeded before
 * that tour type existed, leaving the booking widget with no price for it.
 */
export async function getPriceBounds() {
  return adminGetPriceBounds();
}

// ─── Public questionnaire (become-a-guide extra questions, admin-managed) ──────

export async function getPublicQuestionnaire() {
  const [q, settings] = await Promise.all([
    prisma.questionnaire.findFirst({
      where: { status: 'ACTIVE' },
      include: { questions: { orderBy: { order: 'asc' } } },
    }),
    prisma.settings.findUnique({ where: { id: 'singleton' } }),
  ]);
  const questions = (q?.questions ?? []).map((x) => ({
    id: x.id,
    key: x.fieldKey ?? null,
    type: x.type,
    label: x.label,
    required: x.required,
    options: Array.isArray(x.optionsJson)
      ? (x.optionsJson as unknown[]).filter((o): o is string => typeof o === 'string')
      : [],
  }));
  return { questions, requiredPhotos: settings?.requiredPhotos ?? 3 };
}

// ─── Community guides (website become-a-guide listings that admins published) ──
// These live on the owner's user record (`profileJson.guideListing`), separate
// from the seeded Listing catalog above. Only `status: 'published'` ones are
// public — this is what powers the approved guides shown on Browse guides.

interface CommunityGuideReview {
  name: string;
  rating: number;
  text: string | null;
  date: string; // ISO createdAt
}

interface CommunityGuideRow {
  id: string;
  name: string;
  rating: number | null;
  reviews: number;
  listing: Record<string, unknown>;
  reviewList: CommunityGuideReview[];
}

function publishedListing(profileJson: unknown): Record<string, unknown> | null {
  const gl = ((profileJson as Record<string, unknown> | null)?.guideListing ?? null) as
    | Record<string, unknown>
    | null;
  return gl && gl.status === 'published' ? gl : null;
}

/** All published website guides, newest first — with per-guide rating aggregates. */
export async function listPublishedGuides(): Promise<{ data: CommunityGuideRow[] }> {
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true, name: true, profileJson: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const published = users
    .map((u) => ({ u, gl: publishedListing(u.profileJson) }))
    .filter((x): x is { u: (typeof users)[number]; gl: Record<string, unknown> } => x.gl !== null);

  // One grouped query gives the rating average + count for every guide at once.
  const ids = published.map((x) => x.u.id);
  const agg = ids.length
    ? await prisma.review.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: ids }, hidden: false },
        _avg: { rating: true },
        _count: true,
      })
    : [];
  const bySeller = new Map(agg.map((a) => [a.sellerId, a]));

  const data = published.map(({ u, gl }) => {
    const a = bySeller.get(u.id);
    return {
      id: u.id,
      name: u.name,
      rating: a?._avg.rating ?? null,
      reviews: a?._count ?? 0,
      listing: gl,
      reviewList: [],
    };
  });
  return { data };
}

/** A single published website guide by owner id (for the guide detail page). */
export async function getPublishedGuide(id: string): Promise<CommunityGuideRow> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, profileJson: true },
  });
  const gl = u ? publishedListing(u.profileJson) : null;
  if (!u || !gl) throw new HttpError(404, 'not_found', 'Guide not found');

  const reviews = await prisma.review.findMany({
    where: { sellerId: id, hidden: false },
    include: { buyer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const reviewList: CommunityGuideReview[] = reviews.map((r) => ({
    name: r.buyer.name,
    rating: r.rating,
    text: r.text,
    date: r.createdAt.toISOString(),
  }));
  const rating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  return { id: u.id, name: u.name, rating, reviews: reviews.length, listing: gl, reviewList };
}
