// Outbound email over SMTP (nodemailer). Provider-agnostic — configured via
// MAIL_HOST/PORT/USERNAME/PASSWORD (currently Google Workspace: smtp.gmail.com).
//
// The transport is created lazily on first send. If no SMTP password is
// configured, the mailer degrades gracefully: it logs the message (including the
// verification link) instead of throwing, so local dev and CI keep working
// without real credentials.
import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from '@ucpt/db';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

// Master email switch (admin → App config → Email notifications). Cached briefly
// so we don't hit the DB on every send. When off, NO emails go out.
let switchCache: { on: boolean; at: number } | null = null;
async function emailsEnabled(): Promise<boolean> {
  const now = Date.now();
  if (switchCache && now - switchCache.at < 15_000) return switchCache.on;
  try {
    const cfg = await prisma.appConfig.findFirst({ select: { emailNotificationsEnabled: true } });
    const on = cfg?.emailNotificationsEnabled ?? true; // default on if unconfigured
    switchCache = { on, at: now };
    return on;
  } catch {
    return true; // fail open — a DB hiccup shouldn't silently swallow emails
  }
}

let cachedTransport: Transporter | null | undefined;

/** Resolve the SMTP password. Falls back to RESEND_API_KEY for legacy setups. */
function smtpPassword(): string | undefined {
  return config.MAIL_PASSWORD || config.RESEND_API_KEY;
}

function getTransport(): Transporter | null {
  if (cachedTransport !== undefined) return cachedTransport;

  const pass = smtpPassword();
  if (!pass) {
    logger.warn('Mailer disabled: no MAIL_PASSWORD / RESEND_API_KEY set — emails will be logged only.');
    cachedTransport = null;
    return null;
  }

  cachedTransport = nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    secure: config.MAIL_PORT === 465, // 465 = implicit TLS
    auth: { user: config.MAIL_USERNAME, pass },
  });
  return cachedTransport;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

async function send({ to, subject, html, text }: SendArgs): Promise<void> {
  // Global kill-switch — admins can turn off ALL outbound email from App config.
  if (!(await emailsEnabled())) {
    logger.info({ to, subject }, 'Email skipped — notifications disabled in app config');
    return;
  }

  const from = `${config.MAIL_FROM_NAME} <${config.MAIL_FROM_ADDRESS}>`;
  const transport = getTransport();

  if (!transport) {
    logger.info({ to, subject }, `[mailer:dev] ${text}`);
    return;
  }

  try {
    await transport.sendMail({ from, to, subject, html, text });
    logger.info({ to, subject }, 'Email sent');
  } catch (err) {
    // Never let a mail failure break the request flow (e.g. sign-up).
    logger.error({ err, to, subject }, 'Failed to send email');
  }
}

/** First name (or a friendly fallback) for the greeting. */
function firstNameOf(name: string, email: string): string {
  const n = (name || '').trim().split(/\s+/)[0];
  return n || email.split('@')[0] || 'there';
}

// ─── Editable email templates (admins can customize the HTML in the portal) ─────
// Each transactional email has a default HTML template — generated from the built-in
// design using {{placeholders}} — stored in NotificationTemplate. The admin can edit
// the HTML in the portal; renderTemplate() reads the current DB copy and interpolates
// {{variables}} at send time, so a saved edit changes the very next email sent.
// If a template row is missing (or the DB hiccups) the built-in HTML is used.

interface EmailTemplateDef {
  key: string;
  subject: string; // default subject (may contain {{vars}})
  html: () => string; // default HTML with {{vars}} baked in (built from the design fns)
  sampleVars: Record<string, string>; // realistic values for the admin's live preview
}

/** {{name}} placeholder — fed to the design fns so the default template keeps its tokens. */
const P = (name: string) => `{{${name}}}`;

const EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    key: 'email.verify',
    subject: 'Verify your email · {{brand}}',
    html: () => verificationEmailHtml({ first: P('first'), brand: P('brand'), verifyUrl: P('verifyUrl') }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, verifyUrl: 'https://app.example.com/verify?token=abc123' },
  },
  {
    key: 'email.under_review',
    subject: 'Your guide profile is under review · {{brand}}',
    html: () => underReviewEmailHtml({ first: P('first'), brand: P('brand') }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME },
  },
  {
    key: 'email.approved',
    subject: "You're approved — your guide profile is live · {{brand}}",
    html: () => approvedEmailHtml({ first: P('first'), brand: P('brand'), dashboardUrl: P('dashboardUrl') }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, dashboardUrl: 'https://app.example.com/manage-listing' },
  },
  {
    key: 'email.declined',
    subject: 'An update on your guide profile · {{brand}}',
    html: () => declinedEmailHtml({ first: P('first'), brand: P('brand'), dashboardUrl: P('dashboardUrl') }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, dashboardUrl: 'https://app.example.com/manage-listing' },
  },
  // Counselor equivalents of the three applicant emails above. Separate rows so an
  // admin can word them independently — a counselor is an outside professional, not a
  // student, and the guide copy (ID checks, campus photos, hosting tours) is wrong.
  {
    key: 'email.counselor.under_review',
    subject: 'Your counselor profile is under review · {{brand}}',
    html: () =>
      underReviewEmailHtml({
        first: P('first'),
        brand: P('brand'),
        roleNoun: 'college counselor',
        reviewing: 'your credentials and professional background',
      }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME },
  },
  {
    key: 'email.counselor.approved',
    subject: "You're approved — your counselor profile is live · {{brand}}",
    html: () =>
      approvedEmailHtml({
        first: P('first'),
        brand: P('brand'),
        dashboardUrl: P('dashboardUrl'),
        roleProfile: 'counselor profile',
        approvedBody: 'Families can now find you in the counselor directory and book consultations.',
      }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, dashboardUrl: 'https://app.example.com/manage-listing' },
  },
  {
    key: 'email.counselor.declined',
    subject: 'An update on your counselor profile · {{brand}}',
    html: () =>
      declinedEmailHtml({
        first: P('first'),
        brand: P('brand'),
        dashboardUrl: P('dashboardUrl'),
        roleProfile: 'counselor profile',
      }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, dashboardUrl: 'https://app.example.com/manage-listing' },
  },
  {
    key: 'email.password_reset',
    subject: 'Reset your password · {{brand}}',
    html: () => passwordResetEmailHtml({ first: P('first'), brand: P('brand'), resetUrl: P('resetUrl') }),
    sampleVars: { first: 'Alex', brand: config.MAIL_FROM_NAME, resetUrl: 'https://app.example.com/reset-password?token=abc123' },
  },
  {
    // One shared design for ALL booking emails (request / confirmed / declined / …).
    // Content (heading, intro, pill, cta) and the {{summaryRows}} table are filled per email.
    key: 'email.booking',
    subject: '{{subject}}',
    html: () =>
      bookingEmailShell({
        brand: P('brand'),
        heading: P('heading'),
        intro: P('intro'),
        pillText: P('pillText'),
        pillBg: P('pillBg'),
        pillColor: P('pillColor'),
        summaryRows: P('summaryRows'),
        ctaLabel: P('ctaLabel'),
        ctaUrl: P('ctaUrl'),
        footer: P('footer'),
      }),
    sampleVars: {
      subject: `Booking request sent · ${config.MAIL_FROM_NAME}`,
      brand: config.MAIL_FROM_NAME,
      heading: 'Booking request sent',
      intro:
        "Hi Asad, your campus tour request has been sent to <strong>Faheem Haider</strong>. We'll email you the moment they respond.",
      pillText: '⏳ Awaiting the guide',
      pillBg: '#fef3c7',
      pillColor: '#92400e',
      summaryRows: bookingSummaryRowsHtml({
        ref: 'B-16',
        service: 'In-person campus tour',
        school: 'UCLA',
        whenText: 'Jul 14, 2026 · 08:30',
        durationText: '1 hour',
        guests: 2,
        amountCents: 4000,
      }),
      ctaLabel: 'View in My tours',
      ctaUrl: 'https://app.example.com/my-tours',
      footer: "You won't be charged until Faheem Haider accepts.",
    },
  },
];

/** Realistic preview values for an editable email template (used by the admin preview). */
export function emailTemplateSample(key: string): Record<string, string> | null {
  return EMAIL_TEMPLATES.find((t) => t.key === key)?.sampleVars ?? null;
}

/** Create any missing default email templates so admins can see + edit them. Never clobbers a saved edit. */
export async function ensureEmailTemplates(): Promise<void> {
  await Promise.all(
    EMAIL_TEMPLATES.map((t) =>
      prisma.notificationTemplate.upsert({
        where: { key: t.key },
        update: {},
        create: { key: t.key, channel: 'EMAIL', subject: t.subject, body: t.html() },
      }),
    ),
  );
}

/** Replace {{var}} tokens in a string. */
function interpolate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => vars[k] ?? '');
}

/**
 * Render an email from its (admin-editable) DB template — interpolated subject + html.
 * Returns null if the template is missing so the caller can fall back to the built-in.
 */
async function renderTemplate(
  key: string,
  vars: Record<string, string>,
): Promise<{ subject: string; html: string } | null> {
  try {
    const tpl = await prisma.notificationTemplate.findUnique({ where: { key }, select: { subject: true, body: true } });
    if (!tpl?.body) return null;
    return { subject: interpolate(tpl.subject ?? '', vars), html: interpolate(tpl.body, vars) };
  } catch {
    return null; // a DB hiccup must never block a transactional email
  }
}

/**
 * Send the "verify your email" message with a single call-to-action button
 * pointing at the website's verification page.
 */
export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;

  const text =
    `Hi ${first},\n\n` +
    `Thanks for signing up for ${brand}. Please confirm your email address by opening the link below:\n\n` +
    `${opts.verifyUrl}\n\n` +
    `This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.`;

  const t = await renderTemplate('email.verify', { first, brand, verifyUrl: opts.verifyUrl });
  await send({
    to: opts.to,
    subject: t?.subject ?? `Verify your email · ${brand}`,
    text,
    html: t?.html ?? verificationEmailHtml({ first, brand, verifyUrl: opts.verifyUrl }),
  });
}

/**
 * Send the "your guide profile is under review" message after a user submits
 * their become-a-guide application.
 */
/**
 * Role-specific wording for the three applicant emails.
 *
 * Guides and counselors apply through the same machinery but are different products —
 * a counselor is an outside professional with no enrollment, ID check, or campus
 * photos, so the guide copy is actively wrong for them.
 */
export type ApplicantEmailKind = 'GUIDE' | 'COUNSELOR';

interface RoleCopy {
  /** "guide" / "college counselor" — used mid-sentence. */
  noun: string;
  /** "guide profile" / "counselor profile" — used in subjects. */
  profile: string;
  /** What the review actually covers. */
  reviewing: string;
  /** What approval unlocks. */
  approvedBody: string;
  /** Admin-managed template key prefix. */
  templatePrefix: string;
}

const ROLE_COPY: Record<ApplicantEmailKind, RoleCopy> = {
  GUIDE: {
    noun: 'guide',
    profile: 'guide profile',
    reviewing: 'your details, ID, and photos',
    approvedBody: 'Students can find your listing and start booking tours with you.',
    templatePrefix: 'email',
  },
  COUNSELOR: {
    noun: 'college counselor',
    profile: 'counselor profile',
    reviewing: 'your credentials and professional background',
    approvedBody: 'Families can now find you in the counselor directory and book consultations.',
    templatePrefix: 'email.counselor',
  },
};

export async function sendProfileUnderReviewEmail(opts: {
  to: string;
  name: string;
  kind?: ApplicantEmailKind;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;
  const c = ROLE_COPY[opts.kind ?? 'GUIDE'];

  const text =
    `Hi ${first},\n\n` +
    `Thanks for applying to become a ${c.noun} with ${brand}. ` +
    `We've received your profile and it's now under review by our team.\n\n` +
    `What happens next: our team will review ${c.reviewing} — this usually takes 1–2 business days. ` +
    `We'll email you as soon as a decision is made.\n\n` +
    `You don't need to do anything right now. Thanks for your patience!`;

  // Counselors look for `email.counselor.under_review` first; if an admin hasn't
  // created one, the built-in counselor copy below is used (never the guide template).
  const t = await renderTemplate(`${c.templatePrefix}.under_review`, { first, brand });
  await send({
    to: opts.to,
    subject: t?.subject ?? `Your ${c.profile} is under review · ${brand}`,
    text,
    html: t?.html ?? underReviewEmailHtml({ first, brand, roleNoun: c.noun, reviewing: c.reviewing }),
  });
}

/**
 * Notify the admin team that a guide listing entered review — either a brand-new
 * submission or an edit to an already-live listing that needs re-checking.
 */
export async function sendListingReviewAdminEmail(opts: {
  to: string; // one or more admin addresses (comma-separated)
  guideName: string;
  guideEmail: string;
  reviewUrl: string;
  isEdit: boolean;
  kind?: ApplicantEmailKind;
}): Promise<void> {
  const brand = config.MAIL_FROM_NAME;
  const who = opts.guideName?.trim() || opts.guideEmail;
  // "guide listing" vs "counselor profile", so the admin knows which queue to open.
  const thing = opts.kind === 'COUNSELOR' ? 'counselor profile' : 'guide listing';
  const action = opts.isEdit ? `updated their ${thing}` : `submitted a new ${thing}`;
  const subject = opts.isEdit
    ? `${opts.kind === 'COUNSELOR' ? 'Counselor profile' : 'Listing'} edited — ${who} needs re-review · ${brand}`
    : `New ${thing} to review — ${who} · ${brand}`;

  const text =
    `${who} (${opts.guideEmail}) just ${action}, so it's back in the review queue.\n\n` +
    `Please open the admin, check the changes, and set the status (publish / suspend):\n${opts.reviewUrl}\n\n` +
    `— ${brand}`;

  await send({
    to: opts.to,
    subject,
    text,
    html: adminListingReviewHtml({ brand, who, guideEmail: opts.guideEmail, reviewUrl: opts.reviewUrl, isEdit: opts.isEdit, thing }),
  });
}

/**
 * Send the "your guide profile has been approved" email once an admin publishes
 * the listing.
 */
export async function sendProfileApprovedEmail(opts: {
  to: string;
  name: string;
  dashboardUrl: string;
  kind?: ApplicantEmailKind;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;
  const c = ROLE_COPY[opts.kind ?? 'GUIDE'];
  const closing =
    opts.kind === 'COUNSELOR'
      ? "Welcome aboard — we can't wait to see you help your first family."
      : "Welcome aboard — we can't wait to see you host your first tour.";

  const text =
    `Hi ${first},\n\n` +
    `Great news — your ${c.profile} has been approved and is now live on ${brand}! ` +
    `${c.approvedBody}\n\n` +
    `Manage your profile here:\n${opts.dashboardUrl}\n\n` +
    closing;

  const t = await renderTemplate(`${c.templatePrefix}.approved`, { first, brand, dashboardUrl: opts.dashboardUrl });
  await send({
    to: opts.to,
    subject: t?.subject ?? `You're approved — your ${c.profile} is live · ${brand}`,
    text,
    html: t?.html ?? approvedEmailHtml({ first, brand, dashboardUrl: opts.dashboardUrl, roleProfile: c.profile, approvedBody: c.approvedBody }),
  });
}

/**
 * Send the "your guide profile needs changes" email when an admin suspends a
 * listing (i.e. it's not approved as submitted).
 */
export async function sendProfileDeclinedEmail(opts: {
  to: string;
  name: string;
  dashboardUrl: string;
  kind?: ApplicantEmailKind;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;
  const c = ROLE_COPY[opts.kind ?? 'GUIDE'];
  const interest =
    opts.kind === 'COUNSELOR' ? `counseling with ${brand}` : `guiding with ${brand}`;

  const text =
    `Hi ${first},\n\n` +
    `Thanks for your interest in ${interest}. After reviewing your profile, ` +
    `we're not able to approve it as submitted and it has been paused.\n\n` +
    `You can review and update it here:\n${opts.dashboardUrl}\n\n` +
    `If you have questions, just reply to this email.`;

  const t = await renderTemplate(`${c.templatePrefix}.declined`, { first, brand, dashboardUrl: opts.dashboardUrl });
  await send({
    to: opts.to,
    subject: t?.subject ?? `An update on your ${c.profile} · ${brand}`,
    text,
    html: t?.html ?? declinedEmailHtml({ first, brand, dashboardUrl: opts.dashboardUrl, roleProfile: c.profile }),
  });
}

/**
 * Send the "reset your password" email with a single call-to-action button
 * pointing at the website's create-new-password page.
 */
export async function sendPasswordResetEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;

  const text =
    `Hi ${first},\n\n` +
    `We received a request to reset the password for your ${brand} account. ` +
    `Open the link below to choose a new password:\n\n` +
    `${opts.resetUrl}\n\n` +
    `This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.`;

  const t = await renderTemplate('email.password_reset', { first, brand, resetUrl: opts.resetUrl });
  await send({
    to: opts.to,
    subject: t?.subject ?? `Reset your password · ${brand}`,
    text,
    html: t?.html ?? passwordResetEmailHtml({ first, brand, resetUrl: opts.resetUrl }),
  });
}

// ─── Booking emails ───────────────────────────────────────────────────────────

export interface BookingEmailSummary {
  ref?: string | null; // human-friendly booking reference, e.g. "B-1"
  service: string; // "In-person campus tour" | "Virtual video chat" | "Professional consultation"
  whenText: string; // "Aug 15, 2026 · 10:00 AM (ET)"
  durationText?: string | null;
  guests: number;
  amountCents: number;
  title?: string | null;
  school?: string | null;
  meetingLink?: string | null; // Google Meet / Zoom link (online bookings, once confirmed)
}

function usd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents ?? 0) / 100);
}

/** Ordered rows shown in every booking email. */
function summaryRows(s: BookingEmailSummary): [string, string][] {
  const rows: [string, string][] = [];
  if (s.ref) rows.push(['Booking', s.ref]);
  rows.push(['Service', s.service]);
  if (s.school) rows.push(['School', s.school]);
  rows.push(['When', s.whenText]);
  if (s.durationText) rows.push(['Duration', s.durationText]);
  rows.push(['Guests', String(s.guests)]);
  rows.push(['Amount', usd(s.amountCents)]);
  if (s.meetingLink) rows.push(['Meeting link', s.meetingLink]);
  return rows;
}

function summaryText(s: BookingEmailSummary): string {
  return summaryRows(s).map(([k, v]) => `  ${k}: ${v}`).join('\n');
}

/** Send one booking email via the (admin-editable) `email.booking` template, else built-in. */
async function sendBookingEmail(
  to: string,
  subject: string,
  text: string,
  opts: {
    heading: string;
    intro: string;
    pill: { text: string; bg: string; color: string };
    summary: BookingEmailSummary;
    cta: { label: string; url: string };
    footer?: string;
  },
): Promise<void> {
  const brand = config.MAIL_FROM_NAME;
  const footer = opts.footer ?? `Manage all your bookings anytime from My tours.`;
  const t = await renderTemplate('email.booking', {
    subject,
    brand,
    heading: opts.heading,
    intro: opts.intro,
    pillText: opts.pill.text,
    pillBg: opts.pill.bg,
    pillColor: opts.pill.color,
    summaryRows: bookingSummaryRowsHtml(opts.summary),
    ctaLabel: opts.cta.label,
    ctaUrl: opts.cta.url,
    footer,
  });
  await send({
    to,
    subject: t?.subject ?? subject,
    text,
    html: t?.html ?? bookingEmailHtml({ brand, heading: opts.heading, intro: opts.intro, pill: opts.pill, summary: opts.summary, cta: opts.cta, footer }),
  });
}

/**
 * A booking was just requested. The guide gets a "new request" email; the guest
 * gets a "request sent" confirmation. Best-effort — never throws to the caller.
 */
export async function sendNewBookingEmails(opts: {
  guide: { email: string; name: string };
  guest: { email: string; name: string };
  summary: BookingEmailSummary;
}): Promise<void> {
  const brand = config.MAIL_FROM_NAME;
  const guideFirst = firstNameOf(opts.guide.name, opts.guide.email);
  const guestFirst = firstNameOf(opts.guest.name, opts.guest.email);
  const dash = `${config.APP_WEB_URL.replace(/\/+$/, '')}/my-tours`;

  // → Guide: you have a new booking request
  await sendBookingEmail(
    opts.guide.email,
    `New ${opts.summary.service.toLowerCase()} request from ${opts.guest.name} · ${brand}`,
    `Hi ${guideFirst},\n\n` +
      `${opts.guest.name} has requested to book a ${opts.summary.service.toLowerCase()} with you.\n\n` +
      `${summaryText(opts.summary)}\n\n` +
      `Review and accept or decline it here: ${dash}\n\n` +
      `You won't be paid until you accept and complete the tour.`,
    {
      heading: `New booking request`,
      intro: `Hi ${guideFirst}, <strong>${opts.guest.name}</strong> has requested to book a ${opts.summary.service.toLowerCase()} with you.`,
      pill: { text: '📥 New request', bg: '#fef3c7', color: '#92400e' },
      summary: opts.summary,
      cta: { label: 'Review the request', url: dash },
      footer: `You won't be paid until you accept and complete the tour.`,
    },
  );

  // → Guest: your request has been sent
  await sendBookingEmail(
    opts.guest.email,
    `Your ${opts.summary.service.toLowerCase()} request to ${opts.guide.name} · ${brand}`,
    `Hi ${guestFirst},\n\n` +
      `Your ${opts.summary.service.toLowerCase()} request has been sent to ${opts.guide.name}.\n\n` +
      `${summaryText(opts.summary)}\n\n` +
      `Track it here: ${dash}\n\n` +
      `You won't be charged until ${opts.guide.name} accepts.`,
    {
      heading: `Booking request sent`,
      intro: `Hi ${guestFirst}, your ${opts.summary.service.toLowerCase()} request has been sent to <strong>${opts.guide.name}</strong>. We'll email you the moment they respond.`,
      pill: { text: '⏳ Awaiting the guide', bg: '#fef3c7', color: '#92400e' },
      summary: opts.summary,
      cta: { label: 'View in My tours', url: dash },
      footer: `You won't be charged until ${opts.guide.name} accepts.`,
    },
  );
}

/** A booking's status changed (accepted / declined / cancelled / completed). */
export async function sendBookingStatusEmails(opts: {
  guide: { email: string; name: string };
  guest: { email: string; name: string };
  status: string;
  summary: BookingEmailSummary;
}): Promise<void> {
  const brand = config.MAIL_FROM_NAME;
  const dash = `${config.APP_WEB_URL.replace(/\/+$/, '')}/my-tours`;
  const svc = opts.summary.service.toLowerCase();
  const guideFirst = firstNameOf(opts.guide.name, opts.guide.email);
  const guestFirst = firstNameOf(opts.guest.name, opts.guest.email);

  const map: Record<string, { pill: { text: string; bg: string; color: string }; guest: string; guide: string; subject: string } | undefined> = {
    CONFIRMED: {
      pill: { text: '✅ Confirmed', bg: '#dcfce7', color: '#166534' },
      subject: `Your ${svc} is confirmed`,
      guest: `Great news — <strong>${opts.guide.name}</strong> confirmed your ${svc}. You're all set!`,
      guide: `You confirmed the ${svc} with <strong>${opts.guest.name}</strong>. It's on your schedule.`,
    },
    DECLINED: {
      pill: { text: 'Declined', bg: '#fee2e2', color: '#991b1b' },
      subject: `Update on your ${svc} request`,
      guest: `Unfortunately <strong>${opts.guide.name}</strong> couldn't accept your ${svc} this time. You weren't charged — try another guide.`,
      guide: `You declined the ${svc} request from <strong>${opts.guest.name}</strong>.`,
    },
    CANCELLED: {
      pill: { text: 'Cancelled', bg: '#fee2e2', color: '#991b1b' },
      subject: `Your ${svc} was cancelled`,
      guest: `Your ${svc} with <strong>${opts.guide.name}</strong> has been cancelled. Any authorization has been released.`,
      guide: `The ${svc} with <strong>${opts.guest.name}</strong> has been cancelled.`,
    },
    COMPLETED: {
      pill: { text: '🎉 Completed', bg: '#dcfce7', color: '#166534' },
      subject: `Your ${svc} is complete`,
      guest: `Your ${svc} with <strong>${opts.guide.name}</strong> is marked complete. We hope it was insightful — leave a review!`,
      guide: `Nice work — your ${svc} with <strong>${opts.guest.name}</strong> is complete.`,
    },
  };
  const m = map[opts.status];
  if (!m) return; // PENDING / EXPIRED → no notification

  // Only surface the meeting link in the confirmation email (once the booking is live).
  const summary = opts.status === 'CONFIRMED' ? opts.summary : { ...opts.summary, meetingLink: null };

  await sendBookingEmail(
    opts.guest.email,
    `${m.subject} · ${brand}`,
    `Hi ${guestFirst},\n\n${m.guest.replace(/<[^>]+>/g, '')}\n\n${summaryText(summary)}\n\n${dash}`,
    { heading: m.subject, intro: `Hi ${guestFirst}, ${m.guest}`, pill: m.pill, summary, cta: { label: 'View in My tours', url: dash } },
  );
  await sendBookingEmail(
    opts.guide.email,
    `${m.subject} · ${brand}`,
    `Hi ${guideFirst},\n\n${m.guide.replace(/<[^>]+>/g, '')}\n\n${summaryText(summary)}\n\n${dash}`,
    { heading: m.subject, intro: `Hi ${guideFirst}, ${m.guide}`, pill: m.pill, summary, cta: { label: 'View in My tours', url: dash } },
  );
}

/** Self-contained, inline-styled HTML email (max compatibility across clients). */
function verificationEmailHtml(opts: { first: string; brand: string; verifyUrl: string }): string {
  const { first, brand, verifyUrl } = opts;
  const maroon = '#7A1B2E';
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand}</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">Hi ${first}, verify your email address</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Thanks for signing up. Please confirm your email address to activate your account and start booking or hosting campus tours.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${verifyUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">Verify my email</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 8px 40px;font-size:13px;line-height:1.6;color:#6b7280;">
                Or paste this link into your browser:<br />
                <a href="${verifyUrl}" style="color:${maroon};word-break:break-all;">${verifyUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                This link expires in 24 hours. If you didn't create an account with ${brand}, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** "Guide profile under review" confirmation email. */
function underReviewEmailHtml(opts: { first: string; brand: string; roleNoun?: string; reviewing?: string }): string {
  const { first, brand } = opts;
  const roleNoun = opts.roleNoun ?? 'guide';
  const reviewing = opts.reviewing ?? 'your details, ID, and photos';
  const maroon = '#7A1B2E';
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand}</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">Your profile is under review</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Hi ${first}, thanks for applying to become a ${roleNoun}. We've received your application and our team is reviewing ${reviewing} now.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;">⏳ Status: Under review</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Reviews usually take <strong>1–2 business days</strong>. We'll email you the moment a decision is made — you don't need to do anything in the meantime.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                Thanks for your patience — we're excited to have you on board.<br />— The ${brand} team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Admin-facing "a listing entered review" email. */
function adminListingReviewHtml(opts: {
  brand: string;
  who: string;
  guideEmail: string;
  reviewUrl: string;
  isEdit: boolean;
  /** "guide listing" or "counselor profile" — what the admin is being asked to review. */
  thing?: string;
}): string {
  const { brand, who, guideEmail, reviewUrl, isEdit } = opts;
  const thing = opts.thing ?? 'guide listing';
  const maroon = '#7A1B2E';
  const heading = isEdit ? 'A listing was edited' : 'New listing to review';
  const pill = isEdit
    ? '<div style="display:inline-block;background:#fef3c7;color:#92400e;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;">✏️ Edited · needs re-review</div>'
    : '<div style="display:inline-block;background:#e0e7ff;color:#3730a3;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;">🆕 New submission</div>';
  const line = isEdit
    ? `<strong>${who}</strong> (${guideEmail}) updated their ${thing}, so it's back in the review queue.`
    : `<strong>${who}</strong> (${guideEmail}) submitted a new ${thing} for review.`;
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand} · Admin</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">${heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px 40px;">${pill}</td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                ${line} Please review the changes and set its status.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${reviewUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">Open listing in admin</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                You're receiving this because you're an admin on ${brand}.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** "Guide profile approved / live" email. */
function approvedEmailHtml(opts: { first: string; brand: string; dashboardUrl: string; roleProfile?: string; approvedBody?: string }): string {
  const { first, brand, dashboardUrl } = opts;
  const roleProfile = opts.roleProfile ?? 'guide profile';
  const approvedBody = opts.approvedBody ?? 'Students can find your listing and start booking tours with you.';
  const maroon = '#7A1B2E';
  const green = '#16a34a';
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${green};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand}</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">🎉 You're approved, ${first}!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 8px 40px;">
                <div style="display:inline-block;background:#dcfce7;color:#166534;font-size:13px;font-weight:600;padding:8px 14px;border-radius:999px;">✅ Status: Live</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Your ${roleProfile} has been approved and is now live. ${approvedBody}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">Manage my listing</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                Welcome aboard — we can't wait to see you host your first tour.<br />— The ${brand} team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** "Guide profile paused / not approved" email. */
function declinedEmailHtml(opts: { first: string; brand: string; dashboardUrl: string; roleProfile?: string }): string {
  const { first, brand, dashboardUrl } = opts;
  const roleProfile = opts.roleProfile ?? 'guide profile';
  const maroon = '#7A1B2E';
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand}</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">An update on your guide profile</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Hi ${first}, thanks for your interest in joining ${brand}. After reviewing your ${roleProfile}, we're not able to approve it as submitted, and it has been paused for now.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${dashboardUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">Review my listing</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                If you have any questions, just reply to this email — we're happy to help.<br />— The ${brand} team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** "Reset your password" email. */
function passwordResetEmailHtml(opts: { first: string; brand: string; resetUrl: string }): string {
  const { first, brand, resetUrl } = opts;
  const maroon = '#7A1B2E';
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${brand}</div>
                <h1 style="margin:20px 0 0 0;font-size:24px;line-height:1.3;font-weight:800;color:#111827;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">
                Hi ${first}, we received a request to reset the password for your account. Click the button below to choose a new password.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 8px 40px;">
                <a href="${resetUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">Reset my password</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 8px 40px;font-size:13px;line-height:1.6;color:#6b7280;">
                Or paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:${maroon};word-break:break-all;">${resetUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Shared booking email — heading, status pill, a details table, and a CTA. */
const BOOKING_MAROON = '#7A1B2E';

/** The <tr> rows of a booking summary table (raw HTML) — the dynamic part of the email. */
function bookingSummaryRowsHtml(s: BookingEmailSummary): string {
  return summaryRows(s)
    .map(([k, v]) => {
      // Render URL values (e.g. the meeting link) as a clickable, wrapping anchor.
      const cell = /^https?:\/\//i.test(v)
        ? `<a href="${v}" style="color:${BOOKING_MAROON};font-weight:600;word-break:break-all;">${v}</a>`
        : v;
      return `<tr>
          <td style="padding:8px 12px 8px 0;font-size:13px;color:#6b7280;vertical-align:top;">${k}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;word-break:break-word;">${cell}</td>
        </tr>`;
    })
    .join('');
}

/**
 * The booking-email design shell with FLAT fields, so the whole design can live in an
 * editable template. `summaryRows` is pre-rendered <tr> HTML (the dynamic table body),
 * injected via the {{summaryRows}} token when this is an admin-editable template.
 */
function bookingEmailShell(v: {
  brand: string;
  heading: string;
  intro: string;
  pillText: string;
  pillBg: string;
  pillColor: string;
  summaryRows: string;
  ctaLabel: string;
  ctaUrl: string;
  footer: string;
}): string {
  const maroon = BOOKING_MAROON;
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr><td style="background:${maroon};height:6px;line-height:6px;font-size:6px;">&nbsp;</td></tr>
            <tr>
              <td style="padding:40px 40px 8px 40px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${v.brand}</div>
                <h1 style="margin:18px 0 0 0;font-size:23px;line-height:1.3;font-weight:800;color:#111827;">${v.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 40px 4px 40px;">
                <span style="display:inline-block;background:${v.pillBg};color:${v.pillColor};font-size:13px;font-weight:600;padding:7px 13px;border-radius:999px;">${v.pillText}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">${v.intro}</td>
            </tr>
            <tr>
              <td style="padding:12px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;padding:6px 16px;">
                  ${v.summaryRows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 8px 40px;">
                <a href="${v.ctaUrl}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">${v.ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                ${v.footer}<br />— The ${v.brand} team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Structured wrapper over the shell — used as the built-in fallback design. */
function bookingEmailHtml(opts: {
  brand: string;
  heading: string;
  intro: string;
  pill: { text: string; bg: string; color: string };
  summary: BookingEmailSummary;
  cta: { label: string; url: string };
  footer?: string;
}): string {
  return bookingEmailShell({
    brand: opts.brand,
    heading: opts.heading,
    intro: opts.intro,
    pillText: opts.pill.text,
    pillBg: opts.pill.bg,
    pillColor: opts.pill.color,
    summaryRows: bookingSummaryRowsHtml(opts.summary),
    ctaLabel: opts.cta.label,
    ctaUrl: opts.cta.url,
    footer: opts.footer ?? `Manage all your bookings anytime from My tours.`,
  });
}
