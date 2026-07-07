import { prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function listSchools(q?: string) {
  return prisma.school.findMany({
    where: {
      enabled: true,
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: { _count: { select: { listings: true, sellerProfiles: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function autocompleteSchools(q: string) {
  return prisma.school.findMany({
    where: { enabled: true, name: { contains: q, mode: 'insensitive' } },
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
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
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

export async function getPriceBounds() {
  return prisma.servicePriceBound.findMany();
}

// ─── Community guides (website become-a-guide listings that admins published) ──
// These live on the owner's user record (`profileJson.guideListing`), separate
// from the seeded Listing catalog above. Only `status: 'published'` ones are
// public — this is what powers the approved guides shown on Browse guides.

interface CommunityGuideRow {
  id: string;
  name: string;
  rating: number | null;
  reviews: number;
  listing: Record<string, unknown>;
}

function toCommunityGuide(u: {
  id: string;
  name: string;
  profileJson: unknown;
  sellerProfile: { ratingAvg: number | null; ratingCount: number } | null;
}): CommunityGuideRow | null {
  const gl = ((u.profileJson as Record<string, unknown> | null)?.guideListing ?? null) as
    | Record<string, unknown>
    | null;
  if (!gl || gl.status !== 'published') return null;
  return {
    id: u.id,
    name: u.name,
    rating: u.sellerProfile?.ratingAvg ?? null,
    reviews: u.sellerProfile?.ratingCount ?? 0,
    listing: gl,
  };
}

/** All published website guides, newest first. */
export async function listPublishedGuides(): Promise<{ data: CommunityGuideRow[] }> {
  const users = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: {
      id: true,
      name: true,
      profileJson: true,
      createdAt: true,
      sellerProfile: { select: { ratingAvg: true, ratingCount: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const data = users.map(toCommunityGuide).filter((g): g is CommunityGuideRow => g !== null);
  return { data };
}

/** A single published website guide by owner id (for the guide detail page). */
export async function getPublishedGuide(id: string): Promise<CommunityGuideRow> {
  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      profileJson: true,
      sellerProfile: { select: { ratingAvg: true, ratingCount: true } },
    },
  });
  const guide = u ? toCommunityGuide(u) : null;
  if (!guide) throw new HttpError(404, 'not_found', 'Guide not found');
  return guide;
}
