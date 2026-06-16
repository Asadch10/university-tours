// Zod schemas shared by the backend (request/response validation) and the web/mobile
// forms (React Hook Form). One contract for all clients (Part I §6, OpenAPI from Zod).
import { z } from 'zod';

export const serviceTypeSchema = z.enum(['CAMPUS_TOUR', 'VIDEO_CONSULTATION']);
export const userRoleSchema = z.enum(['BUYER', 'SELLER', 'ADMIN']);

// --- Auth ---
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  role: z.enum(['BUYER', 'SELLER']),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

// --- Listings (validated against service price bounds) ---
export const listingOptionSchema = z.object({
  durationMinutes: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

export const createListingSchema = z.object({
  schoolId: z.string().min(1),
  serviceType: serviceTypeSchema,
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional(),
  options: z.array(listingOptionSchema).min(1),
});
export type CreateListingInput = z.infer<typeof createListingSchema>;

// --- Bookings ---
export const createBookingSchema = z.object({
  listingId: z.string().min(1),
  optionId: z.string().min(1),
  scheduledStartUtc: z.string().datetime(),
  timezone: z.string().min(1),
});
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// --- Reviews ---
export const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional(),
});

// --- Chat ---
export const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
});

// --- Admin: money & config ---
export const setCommissionSchema = z.object({
  commissionPct: z.number().min(0).max(100),
});

export const refundSchema = z.object({
  amountCents: z.number().int().positive().optional(), // omit for full refund
  reason: z.string().max(500).optional(),
});

export const appConfigSchema = z.object({
  minSupportedVersion: z.string().min(1),
  forceUpdateMessage: z.string().nullable().optional(),
  maintenanceBanner: z.string().nullable().optional(),
  featureFlags: z.record(z.boolean()).optional(),
});
