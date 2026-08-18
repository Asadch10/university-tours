// Seed: service price bounds, settings, app config, admin roles, questionnaire,
// schools, notification templates, and the initial admin accounts.
// Run with: pnpm --filter @ucpt/db seed
import {
  PrismaClient,
  ServiceType,
  QuestionnaireStatus,
  QuestionType,
  ApplicantKind,
  UserRole,
  AdminRoleName,
  NotificationChannel,
  CampaignSegment,
  CampaignStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { ADMIN_PERMISSIONS } from '@ucpt/types';

const prisma = new PrismaClient();

// Single source of truth lives in @ucpt/types so the seed, the backend token and
// the console's nav can never drift apart again.
const ALL_PERMISSIONS = [...ADMIN_PERMISSIONS];


async function main() {
  console.log('Seeding database…');

  // --- Service price bounds ---
  // Suggested prices per tour type. `update: {}` keeps any value an admin has already
  // set from the console — re-seeding never overwrites a live configuration.
  const PRICE_BOUNDS = [
    { serviceType: ServiceType.CAMPUS_TOUR, minCents: 2000, maxCents: 20000, suggested1hCents: 8000, suggested2hCents: 16000 },
    { serviceType: ServiceType.VIDEO_CONSULTATION, minCents: 1500, maxCents: 15000, suggested1hCents: 5000, suggested2hCents: 10000 },
    { serviceType: ServiceType.CONSULTATION, minCents: 5000, maxCents: 60000, suggested1hCents: 20000, suggested2hCents: 40000 },
  ];
  for (const bound of PRICE_BOUNDS) {
    await prisma.servicePriceBound.upsert({
      where: { serviceType: bound.serviceType },
      update: {},
      create: bound,
    });
  }

  // --- Platform settings ---
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      commissionPct: 25,
      refundWindowsJson: { fullRefundHoursBeforeStart: 24, guideCancel: 'full' },
      requestExpiryHours: 6,
      maskingEnabled: true,
    },
  });

  // --- App config ---
  const existingConfig = await prisma.appConfig.findFirst();
  if (!existingConfig) {
    await prisma.appConfig.create({
      data: {
        featureFlagsJson: {
          video_consultations: true,
          instant_book: false,
          gift_cards: false,
          multi_currency: false,
        },
        minSupportedVersion: '1.4.0',
        forceUpdateMessage: null,
        maintenanceBanner: null,
      },
    });
  }

  // --- Admin role (single SUPER_ADMIN with all permissions) ---
  await prisma.adminRole.upsert({
    where: { role: AdminRoleName.SUPER_ADMIN },
    update: { permissionsJson: ALL_PERMISSIONS },
    create: { role: AdminRoleName.SUPER_ADMIN, permissionsJson: ALL_PERMISSIONS },
  });

  // --- Single admin account ---
  const adminHash = await argon2.hash('Test@123');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'asadnaeem8@gmail.com' },
    update: { passwordHash: adminHash, name: 'Asad Naeem', adminRoleName: AdminRoleName.SUPER_ADMIN, role: UserRole.ADMIN },
    create: { email: 'asadnaeem8@gmail.com', name: 'Asad Naeem', role: UserRole.ADMIN, adminRoleName: AdminRoleName.SUPER_ADMIN, passwordHash: adminHash, emailVerifiedAt: new Date() },
  });

  // --- Schools ---
  const schoolData = [
    { name: 'Stanford University', slug: 'stanford', location: 'Stanford, CA', seoContent: 'Walk Palm Drive and the Main Quad with students living it every day.', lat: 37.4275, lng: -122.1697, enabled: true },
    { name: 'Harvard University', slug: 'harvard', location: 'Cambridge, MA', seoContent: 'From Harvard Yard to the river houses with insider perspective.', lat: 42.377, lng: -71.1167, enabled: true },
    { name: 'UCLA', slug: 'ucla', location: 'Los Angeles, CA', seoContent: 'Royce Hall, Bruin Walk, and the real LA student experience.', lat: 34.0689, lng: -118.4452, enabled: true },
    { name: 'New York University', slug: 'nyu', location: 'New York, NY', seoContent: 'A campus woven into the city — explore it like a local.', lat: 40.7295, lng: -73.9965, enabled: true },
    { name: 'University of Michigan', slug: 'umich', location: 'Ann Arbor, MI', seoContent: 'The Diag, the Big House, and a classic college town.', lat: 42.278, lng: -83.7382, enabled: true },
    { name: 'UT Austin', slug: 'utexas', location: 'Austin, TX', seoContent: 'Hook em — the Tower, the Drag, and Austin energy.', lat: 30.2849, lng: -97.7341, enabled: true },
    { name: 'University of Washington', slug: 'uw', location: 'Seattle, WA', seoContent: 'Cherry blossoms on the Quad and Pacific Northwest energy.', lat: 47.6553, lng: -122.3035, enabled: false },
  ];
  const schools: Record<string, string> = {};
  for (const s of schoolData) {
    // Coordinates are backfilled on reseed (they drive the explore map);
    // other fields stay untouched so admin edits survive.
    const school = await prisma.school.upsert({
      where: { slug: s.slug },
      update: { lat: s.lat, lng: s.lng },
      create: s,
    });
    schools[s.slug] = school.id;
  }

  // NOTE: no demo users are seeded.
  //
  // This used to create 5 fake buyers (@example.com) and 6 fake student guides
  // (@stanford.edu, @harvard.edu, …) plus 5 listings they owned. Because the seed
  // runs against real environments, those accounts showed up in the live admin
  // console as if they were customers, and their listings were publicly bookable.
  //
  // Real users now come from real sign-ups only. If you want demo data for local
  // development, seed it from a separate script rather than adding it back here —
  // anything in this file can reach production.

  // --- Active guide questionnaire ---
  // Versions are numbered per kind now, so every lookup here is scoped by kind too.
  const existingQ = await prisma.questionnaire.findFirst({
    where: { status: QuestionnaireStatus.ACTIVE, kind: ApplicantKind.GUIDE },
  });
  if (!existingQ) {
    await prisma.questionnaire.create({
      data: {
        kind: ApplicantKind.GUIDE,
        version: 3,
        status: QuestionnaireStatus.ACTIVE,
        questions: {
          create: [
            { type: QuestionType.TEXT, label: 'Full legal name', required: true, order: 1 },
            { type: QuestionType.SINGLE_CHOICE, label: 'Expected graduation year', required: true, order: 2, optionsJson: ['2026', '2027', '2028', '2029'] },
            { type: QuestionType.LONG_TEXT, label: 'Why do you want to be a campus guide?', required: true, order: 3 },
            { type: QuestionType.SINGLE_CHOICE, label: 'How many hours per week can you commit?', required: true, order: 4, optionsJson: ['1–3', '4–6', '7–10', '10+'] },
            { type: QuestionType.MULTI_CHOICE, label: 'Languages you can guide in', required: false, order: 5, optionsJson: ['English', 'Spanish', 'Mandarin', 'Hindi', 'French'] },
            { type: QuestionType.FILE, label: 'Proof of current enrollment', required: true, order: 6 },
          ],
        },
      },
    });
    // Archived versions
    for (const v of [1, 2]) {
      await prisma.questionnaire.upsert({
        where: { kind_version: { kind: ApplicantKind.GUIDE, version: v } },
        update: {},
        create: { kind: ApplicantKind.GUIDE, version: v, status: QuestionnaireStatus.ARCHIVED },
      });
    }
  }

  // --- Active counselor questionnaire ---
  // Counselors are outside admissions professionals, so this asks about credentials
  // and practice rather than enrollment and campus life.
  const existingCounselorQ = await prisma.questionnaire.findFirst({
    where: { status: QuestionnaireStatus.ACTIVE, kind: ApplicantKind.COUNSELOR },
  });
  if (!existingCounselorQ) {
    await prisma.questionnaire.create({
      data: {
        kind: ApplicantKind.COUNSELOR,
        version: 1,
        status: QuestionnaireStatus.ACTIVE,
        questions: {
          create: [
            { type: QuestionType.TEXT, label: 'Full legal name', required: true, order: 1 },
            { type: QuestionType.TEXT, label: 'Professional headline', required: true, order: 2, fieldKey: 'headline' },
            { type: QuestionType.TEXT, label: 'Organization or practice name', required: false, order: 3, fieldKey: 'organization' },
            { type: QuestionType.SINGLE_CHOICE, label: 'Years of experience in college admissions', required: true, order: 4, optionsJson: ['Less than 2', '2–5', '6–10', '11–20', '20+'], fieldKey: 'yearsExperience' },
            { type: QuestionType.TEXT, label: 'Credentials and certifications', required: true, order: 5, fieldKey: 'credentials' },
            { type: QuestionType.MULTI_CHOICE, label: 'Areas of specialty', required: true, order: 6, optionsJson: ['Application strategy', 'Essay coaching', 'Financial aid & scholarships', 'Athletic recruiting', 'International students', 'Transfer admissions', 'Test preparation', 'Special needs / IEP'], fieldKey: 'specialties' },
            { type: QuestionType.LONG_TEXT, label: 'Describe your counseling approach', required: true, order: 7, fieldKey: 'bio' },
            { type: QuestionType.TEXT, label: 'Professional website or LinkedIn', required: false, order: 8, fieldKey: 'website' },
            { type: QuestionType.FILE, label: 'Proof of credentials', required: true, order: 9 },
          ],
        },
      },
    });
  }

  // --- CMS blocks ---
  const cmsData = [
    { key: 'home.hero', type: 'HOMEPAGE_SECTION', contentJson: { title: 'Book private campus tours. Things just got personal.', body: 'Get the scoop and find the school that fits you best on a private campus tour tailored to you.' }, published: true },
    { key: 'faq.refunds', type: 'FAQ', contentJson: { question: 'When am I charged?', answer: 'Your card is authorized at request and only charged when a guide accepts.' }, published: true },
    { key: 'faq.safety', type: 'FAQ', contentJson: { question: 'Are guides verified?', answer: 'Every guide is identity- and enrollment-checked before they can host.' }, published: true },
    { key: 'page.trust-safety', type: 'PAGE', contentJson: { title: 'Trust & Safety', body: 'Our pillars: verification, secure payments, and masked contact details.' }, published: true },
    { key: 'testimonial.karen', type: 'TESTIMONIAL', contentJson: { author: 'Karen D.', quote: 'The student guide answered questions the official tour never could.' }, published: false },
  ];
  for (const b of cmsData) {
    await prisma.cmsBlock.upsert({ where: { key: b.key }, update: {}, create: b });
  }

  // --- Notification templates ---
  const templateData = [
    { key: 'booking.accepted', channel: NotificationChannel.EMAIL, subject: 'Your tour is confirmed', body: 'Hi {{buyer}}, {{guide}} accepted your {{service}} at {{school}} on {{date}}.' },
    { key: 'booking.requested', channel: NotificationChannel.PUSH, subject: 'New tour request', body: '{{buyer}} requested a {{service}} — respond within {{window}}.' },
    { key: 'application.approved', channel: NotificationChannel.EMAIL, subject: "You're approved to host!", body: 'Congratulations {{applicant}} — your guide application was approved.' },
    { key: 'payout.recorded', channel: NotificationChannel.EMAIL, subject: 'A payout is on its way', body: 'Hi {{guide}}, a payout of {{amount}} was recorded via {{method}}.' },
  ];
  for (const t of templateData) {
    await prisma.notificationTemplate.upsert({ where: { key: t.key }, update: {}, create: t });
  }

  // --- Push campaigns ---
  const campaignExists = await prisma.pushCampaign.findFirst();
  if (!campaignExists) {
    await prisma.pushCampaign.createMany({
      data: [
        { segment: CampaignSegment.BUYERS, title: 'Summer tour season is here', body: 'Book a private campus tour before fall visits fill up.', status: CampaignStatus.SENT, scheduledAt: new Date('2026-06-01T15:00:00Z') },
        { segment: CampaignSegment.GUIDES, title: 'Earnings doubled this month', body: 'Demand is high — open more slots to earn more.', status: CampaignStatus.SCHEDULED, scheduledAt: new Date('2026-06-20T15:00:00Z') },
        { segment: CampaignSegment.ALL, title: 'New universities added', body: 'Explore guides at 6 new campuses.', status: CampaignStatus.DRAFT },
      ],
    });
  }

  // --- Audit log entries ---
  const auditExists = await prisma.auditLog.findFirst();
  if (!auditExists) {
    await prisma.auditLog.createMany({
      data: [
        { adminId: superAdmin.id, action: 'commission.update', entity: 'settings/commission → 25%', ip: '10.0.4.12', createdAt: new Date('2026-06-15T13:40:00Z') },
        { adminId: superAdmin.id, action: 'payout.record', entity: 'payouts/Maya Robinson $300.00', ip: '10.0.4.12', createdAt: new Date('2026-06-01T10:00:00Z') },
      ],
    });
  }

  console.log('Seed complete ✓');
  console.log('Super Admin → asadnaeem8@gmail.com / Test@123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
