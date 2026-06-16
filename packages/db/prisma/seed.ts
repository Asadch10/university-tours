// Seed: service price bounds, settings, app config, admin roles, questionnaire,
// schools, notification templates, and the initial admin accounts.
// Run with: pnpm --filter @ucpt/db seed
import {
  PrismaClient,
  ServiceType,
  QuestionnaireStatus,
  QuestionType,
  UserRole,
  AdminRoleName,
  NotificationChannel,
  CampaignSegment,
  CampaignStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const ALL_PERMISSIONS = [
  'dashboard.view',
  'reports.view',
  'applications.decide',
  'questionnaires.manage',
  'commission.set',
  'transactions.view',
  'payouts.record',
  'refunds.issue',
  'users.manage',
  'listings.moderate',
  'bookings.view',
  'bookings.forcecancel',
  'reviews.moderate',
  'universities.manage',
  'cms.edit',
  'appconfig.manage',
  'campaigns.send',
  'templates.edit',
  'admins.manage',
  'audit.view',
];

const MANAGER_PERMISSIONS = ALL_PERMISSIONS.filter(
  (p) => !['commission.set', 'admins.manage'].includes(p),
);

const SUPPORT_PERMISSIONS = [
  'dashboard.view',
  'reports.view',
  'users.manage',
  'listings.moderate',
  'bookings.view',
  'reviews.moderate',
];

async function main() {
  console.log('Seeding database…');

  // --- Service price bounds ---
  await prisma.servicePriceBound.upsert({
    where: { serviceType: ServiceType.CAMPUS_TOUR },
    update: {},
    create: { serviceType: ServiceType.CAMPUS_TOUR, minCents: 2000, maxCents: 20000, suggested1hCents: 5000, suggested2hCents: 9000 },
  });
  await prisma.servicePriceBound.upsert({
    where: { serviceType: ServiceType.VIDEO_CONSULTATION },
    update: {},
    create: { serviceType: ServiceType.VIDEO_CONSULTATION, minCents: 1500, maxCents: 15000, suggested1hCents: 4000, suggested2hCents: 7000 },
  });

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

  // --- Admin roles ---
  await prisma.adminRole.upsert({ where: { role: AdminRoleName.SUPER_ADMIN }, update: { permissionsJson: ALL_PERMISSIONS }, create: { role: AdminRoleName.SUPER_ADMIN, permissionsJson: ALL_PERMISSIONS } });
  await prisma.adminRole.upsert({ where: { role: AdminRoleName.MANAGER }, update: { permissionsJson: MANAGER_PERMISSIONS }, create: { role: AdminRoleName.MANAGER, permissionsJson: MANAGER_PERMISSIONS } });
  await prisma.adminRole.upsert({ where: { role: AdminRoleName.SUPPORT }, update: { permissionsJson: SUPPORT_PERMISSIONS }, create: { role: AdminRoleName.SUPPORT, permissionsJson: SUPPORT_PERMISSIONS } });

  // --- Admin accounts (demo credentials: asadnaeem8@gmail.com / Test@123) ---
  const superHash = await argon2.hash('Test@123');
  const managerHash = await argon2.hash('Manager@123');
  const supportHash = await argon2.hash('Support@123');

  // Remove the legacy demo super admin if it still exists (clear FK-restricted
  // audit logs / payouts / refunds it authored first).
  const legacy = await prisma.user.findUnique({ where: { email: 'test@tour.com' } });
  if (legacy) {
    await prisma.auditLog.deleteMany({ where: { adminId: legacy.id } });
    await prisma.payout.deleteMany({ where: { createdByAdmin: legacy.id } });
    await prisma.refund.deleteMany({ where: { createdBy: legacy.id } });
    await prisma.user.delete({ where: { id: legacy.id } });
  }

  const superAdmin = await prisma.user.upsert({
    where: { email: 'asadnaeem8@gmail.com' },
    update: { passwordHash: superHash, name: 'Asad Naeem', adminRoleName: AdminRoleName.SUPER_ADMIN, role: UserRole.ADMIN },
    create: { email: 'asadnaeem8@gmail.com', name: 'Asad Naeem', role: UserRole.ADMIN, adminRoleName: AdminRoleName.SUPER_ADMIN, passwordHash: superHash, emailVerifiedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: 'jamie.r@tour.com' },
    update: {},
    create: { email: 'jamie.r@tour.com', name: 'Jamie Rivera', role: UserRole.ADMIN, adminRoleName: AdminRoleName.MANAGER, passwordHash: managerHash, emailVerifiedAt: new Date() },
  });
  await prisma.user.upsert({
    where: { email: 'riley.c@tour.com' },
    update: {},
    create: { email: 'riley.c@tour.com', name: 'Riley Chen', role: UserRole.ADMIN, adminRoleName: AdminRoleName.SUPPORT, passwordHash: supportHash, emailVerifiedAt: new Date() },
  });

  // --- Schools ---
  const schoolData = [
    { name: 'Stanford University', slug: 'stanford', location: 'Stanford, CA', seoContent: 'Walk Palm Drive and the Main Quad with students living it every day.', enabled: true },
    { name: 'Harvard University', slug: 'harvard', location: 'Cambridge, MA', seoContent: 'From Harvard Yard to the river houses with insider perspective.', enabled: true },
    { name: 'UCLA', slug: 'ucla', location: 'Los Angeles, CA', seoContent: 'Royce Hall, Bruin Walk, and the real LA student experience.', enabled: true },
    { name: 'New York University', slug: 'nyu', location: 'New York, NY', seoContent: 'A campus woven into the city — explore it like a local.', enabled: true },
    { name: 'University of Michigan', slug: 'umich', location: 'Ann Arbor, MI', seoContent: 'The Diag, the Big House, and a classic college town.', enabled: true },
    { name: 'UT Austin', slug: 'utexas', location: 'Austin, TX', seoContent: 'Hook em — the Tower, the Drag, and Austin energy.', enabled: true },
    { name: 'University of Washington', slug: 'uw', location: 'Seattle, WA', seoContent: 'Cherry blossoms on the Quad and Pacific Northwest energy.', enabled: false },
  ];
  const schools: Record<string, string> = {};
  for (const s of schoolData) {
    const school = await prisma.school.upsert({ where: { slug: s.slug }, update: {}, create: s });
    schools[s.slug] = school.id;
  }

  // --- Buyer users ---
  const buyerHash = await argon2.hash('Buyer@123');
  const buyerData = [
    { email: 'karen.d@example.com', name: 'Karen Davis' },
    { email: 'marcus.t@example.com', name: 'Marcus Thompson' },
    { email: 'alvarez@example.com', name: 'The Alvarez Family' },
    { email: 'wei.lin@example.com', name: 'Wei Lin' },
    { email: 'rachel.g@example.com', name: 'Rachel Green' },
  ];
  const buyers: Record<string, string> = {};
  for (const b of buyerData) {
    const u = await prisma.user.upsert({ where: { email: b.email }, update: {}, create: { ...b, role: UserRole.BUYER, passwordHash: buyerHash, emailVerifiedAt: new Date() } });
    buyers[b.email] = u.id;
  }

  // --- Seller users + profiles ---
  const sellerHash = await argon2.hash('Seller@123');
  const sellerData = [
    { email: 'maya.r@stanford.edu', name: 'Maya Robinson', schoolSlug: 'stanford', major: 'Computer Science', gradYear: 2026 },
    { email: 'daniel.o@harvard.edu', name: 'Daniel Okafor', schoolSlug: 'harvard', major: 'Government', gradYear: 2026 },
    { email: 'sofia.m@ucla.edu', name: 'Sofia Martinez', schoolSlug: 'ucla', major: 'Communications', gradYear: 2026 },
    { email: 'aiden.c@nyu.edu', name: 'Aiden Chen', schoolSlug: 'nyu', major: 'Film', gradYear: 2026 },
    { email: 'priya.nair@umich.edu', name: 'Priya Nair', schoolSlug: 'umich', major: 'Pre-Med', gradYear: 2027 },
    { email: 'jordan.b@utexas.edu', name: 'Jordan Blake', schoolSlug: 'utexas', major: 'Computer Science', gradYear: 2026 },
  ];
  const sellers: Record<string, string> = {};
  for (const s of sellerData) {
    const u = await prisma.user.upsert({
      where: { email: s.email }, update: {},
      create: { email: s.email, name: s.name, role: UserRole.SELLER, passwordHash: sellerHash, emailVerifiedAt: new Date() },
    });
    sellers[s.email] = u.id;
    await prisma.sellerProfile.upsert({
      where: { userId: u.id }, update: {},
      create: {
        userId: u.id,
        schoolId: schools[s.schoolSlug],
        major: s.major,
        gradYear: s.gradYear,
        applicationStatus: 'APPROVED',
        approvedAt: new Date('2025-09-01'),
        ratingAvg: 4.8,
        ratingCount: 20,
        bio: `${s.name} is a current student at their university.`,
      },
    });
  }

  // --- Listings ---
  const listingData = [
    { sellerEmail: 'maya.r@stanford.edu', schoolSlug: 'stanford', serviceType: ServiceType.CAMPUS_TOUR, title: 'The unofficial Stanford tour', description: 'See the real campus beyond the official tour.', options: [{ durationMinutes: 60, priceCents: 6500 }, { durationMinutes: 120, priceCents: 11000 }] },
    { sellerEmail: 'daniel.o@harvard.edu', schoolSlug: 'harvard', serviceType: ServiceType.VIDEO_CONSULTATION, title: 'Harvard admissions & houses Q&A', description: 'Honest answers about Harvard life.', options: [{ durationMinutes: 30, priceCents: 4000 }, { durationMinutes: 60, priceCents: 7000 }] },
    { sellerEmail: 'sofia.m@ucla.edu', schoolSlug: 'ucla', serviceType: ServiceType.CAMPUS_TOUR, title: 'A behind-the-scenes UCLA walk', description: 'The parts of UCLA the official tour skips.', options: [{ durationMinutes: 60, priceCents: 5000 }, { durationMinutes: 90, priceCents: 7000 }] },
    { sellerEmail: 'priya.nair@umich.edu', schoolSlug: 'umich', serviceType: ServiceType.VIDEO_CONSULTATION, title: 'Pre-med & engineering at Michigan', description: 'Real talk on Michigan academics and campus life.', options: [{ durationMinutes: 45, priceCents: 4500 }, { durationMinutes: 60, priceCents: 5500 }] },
    { sellerEmail: 'jordan.b@utexas.edu', schoolSlug: 'utexas', serviceType: ServiceType.CAMPUS_TOUR, title: "Hook 'em: the real UT Austin", description: 'Austin campus life beyond the Tower.', options: [{ durationMinutes: 60, priceCents: 4000 }, { durationMinutes: 120, priceCents: 7000 }] },
  ];

  const listingIds: string[] = [];
  for (const l of listingData) {
    const existing = await prisma.listing.findFirst({ where: { sellerId: sellers[l.sellerEmail], schoolId: schools[l.schoolSlug], serviceType: l.serviceType } });
    if (!existing) {
      const listing = await prisma.listing.create({
        data: {
          sellerId: sellers[l.sellerEmail]!,
          schoolId: schools[l.schoolSlug]!,
          serviceType: l.serviceType,
          title: l.title,
          description: l.description,
          status: 'ACTIVE',
          options: { create: l.options },
        },
        include: { options: true },
      });
      listingIds.push(listing.id);
    }
  }

  // --- Active questionnaire ---
  const existingQ = await prisma.questionnaire.findFirst({ where: { status: QuestionnaireStatus.ACTIVE } });
  if (!existingQ) {
    await prisma.questionnaire.create({
      data: {
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
      await prisma.questionnaire.upsert({ where: { version: v }, update: {}, create: { version: v, status: QuestionnaireStatus.ARCHIVED } });
    }
  }

  // --- CMS blocks ---
  const cmsData = [
    { key: 'home.hero', type: 'HOMEPAGE_SECTION', contentJson: { title: 'See the real campus before you decide.', subtitle: 'Book a private tour with a verified student.' }, published: true },
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
