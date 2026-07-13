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

  await send({
    to: opts.to,
    subject: `Verify your email · ${brand}`,
    text,
    html: verificationEmailHtml({ first, brand, verifyUrl: opts.verifyUrl }),
  });
}

/**
 * Send the "your guide profile is under review" message after a user submits
 * their become-a-guide application.
 */
export async function sendProfileUnderReviewEmail(opts: {
  to: string;
  name: string;
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;

  const text =
    `Hi ${first},\n\n` +
    `Thanks for applying to become a guide with ${brand}. ` +
    `We've received your profile and it's now under review by our team.\n\n` +
    `What happens next: our team will review your details, ID, and photos — this usually takes 1–2 business days. ` +
    `We'll email you as soon as a decision is made.\n\n` +
    `You don't need to do anything right now. Thanks for your patience!`;

  await send({
    to: opts.to,
    subject: `Your guide profile is under review · ${brand}`,
    text,
    html: underReviewEmailHtml({ first, brand }),
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
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;

  const text =
    `Hi ${first},\n\n` +
    `Great news — your guide profile has been approved and is now live on ${brand}! ` +
    `Students can find your listing and start booking tours with you.\n\n` +
    `Manage your listing and availability here:\n${opts.dashboardUrl}\n\n` +
    `Welcome aboard — we can't wait to see you host your first tour.`;

  await send({
    to: opts.to,
    subject: `You're approved — your guide profile is live · ${brand}`,
    text,
    html: approvedEmailHtml({ first, brand, dashboardUrl: opts.dashboardUrl }),
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
}): Promise<void> {
  const first = firstNameOf(opts.name, opts.to);
  const brand = config.MAIL_FROM_NAME;

  const text =
    `Hi ${first},\n\n` +
    `Thanks for your interest in guiding with ${brand}. After reviewing your profile, ` +
    `we're not able to approve it as submitted and your listing has been paused.\n\n` +
    `You can review and update your listing here:\n${opts.dashboardUrl}\n\n` +
    `If you have questions, just reply to this email.`;

  await send({
    to: opts.to,
    subject: `An update on your guide profile · ${brand}`,
    text,
    html: declinedEmailHtml({ first, brand, dashboardUrl: opts.dashboardUrl }),
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

  await send({
    to: opts.to,
    subject: `Reset your password · ${brand}`,
    text,
    html: passwordResetEmailHtml({ first, brand, resetUrl: opts.resetUrl }),
  });
}

// ─── Booking emails ───────────────────────────────────────────────────────────

export interface BookingEmailSummary {
  ref?: string | null; // human-friendly booking reference, e.g. "B-1"
  service: string; // "Campus tour" | "Video chat" | "Consultancy"
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
  await send({
    to: opts.guide.email,
    subject: `New ${opts.summary.service.toLowerCase()} request from ${opts.guest.name} · ${brand}`,
    text:
      `Hi ${guideFirst},\n\n` +
      `${opts.guest.name} has requested to book a ${opts.summary.service.toLowerCase()} with you.\n\n` +
      `${summaryText(opts.summary)}\n\n` +
      `Review and accept or decline it here: ${dash}\n\n` +
      `You won't be paid until you accept and complete the tour.`,
    html: bookingEmailHtml({
      brand,
      heading: `New booking request`,
      intro: `Hi ${guideFirst}, <strong>${opts.guest.name}</strong> has requested to book a ${opts.summary.service.toLowerCase()} with you.`,
      pill: { text: '📥 New request', bg: '#fef3c7', color: '#92400e' },
      summary: opts.summary,
      cta: { label: 'Review the request', url: dash },
      footer: `You won't be paid until you accept and complete the tour.`,
    }),
  });

  // → Guest: your request has been sent
  await send({
    to: opts.guest.email,
    subject: `Your ${opts.summary.service.toLowerCase()} request to ${opts.guide.name} · ${brand}`,
    text:
      `Hi ${guestFirst},\n\n` +
      `Your ${opts.summary.service.toLowerCase()} request has been sent to ${opts.guide.name}.\n\n` +
      `${summaryText(opts.summary)}\n\n` +
      `Track it here: ${dash}\n\n` +
      `You won't be charged until ${opts.guide.name} accepts.`,
    html: bookingEmailHtml({
      brand,
      heading: `Booking request sent`,
      intro: `Hi ${guestFirst}, your ${opts.summary.service.toLowerCase()} request has been sent to <strong>${opts.guide.name}</strong>. We'll email you the moment they respond.`,
      pill: { text: '⏳ Awaiting the guide', bg: '#fef3c7', color: '#92400e' },
      summary: opts.summary,
      cta: { label: 'View in My tours', url: dash },
      footer: `You won't be charged until ${opts.guide.name} accepts.`,
    }),
  });
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

  await send({
    to: opts.guest.email,
    subject: `${m.subject} · ${brand}`,
    text: `Hi ${guestFirst},\n\n${m.guest.replace(/<[^>]+>/g, '')}\n\n${summaryText(summary)}\n\n${dash}`,
    html: bookingEmailHtml({ brand, heading: m.subject, intro: `Hi ${guestFirst}, ${m.guest}`, pill: m.pill, summary, cta: { label: 'View in My tours', url: dash } }),
  });
  await send({
    to: opts.guide.email,
    subject: `${m.subject} · ${brand}`,
    text: `Hi ${guideFirst},\n\n${m.guide.replace(/<[^>]+>/g, '')}\n\n${summaryText(summary)}\n\n${dash}`,
    html: bookingEmailHtml({ brand, heading: m.subject, intro: `Hi ${guideFirst}, ${m.guide}`, pill: m.pill, summary, cta: { label: 'View in My tours', url: dash } }),
  });
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
function underReviewEmailHtml(opts: { first: string; brand: string }): string {
  const { first, brand } = opts;
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
                Hi ${first}, thanks for applying to become a guide. We've received your application and our team is reviewing your details, ID, and photos now.
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

/** "Guide profile approved / live" email. */
function approvedEmailHtml(opts: { first: string; brand: string; dashboardUrl: string }): string {
  const { first, brand, dashboardUrl } = opts;
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
                Your guide profile has been approved and is now live. Students can find your listing and start booking tours with you.
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
function declinedEmailHtml(opts: { first: string; brand: string; dashboardUrl: string }): string {
  const { first, brand, dashboardUrl } = opts;
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
                Hi ${first}, thanks for your interest in guiding with ${brand}. After reviewing your profile, we're not able to approve it as submitted, and your listing has been paused for now.
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
function bookingEmailHtml(opts: {
  brand: string;
  heading: string;
  intro: string;
  pill: { text: string; bg: string; color: string };
  summary: BookingEmailSummary;
  cta: { label: string; url: string };
  footer?: string;
}): string {
  const maroon = '#7A1B2E';
  const rows = summaryRows(opts.summary)
    .map(([k, v]) => {
      // Render URL values (e.g. the meeting link) as a clickable, wrapping anchor.
      const cell = /^https?:\/\//i.test(v)
        ? `<a href="${v}" style="color:${maroon};font-weight:600;word-break:break-all;">${v}</a>`
        : v;
      return `<tr>
          <td style="padding:8px 12px 8px 0;font-size:13px;color:#6b7280;vertical-align:top;">${k}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;word-break:break-word;">${cell}</td>
        </tr>`;
    })
    .join('');

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
                <div style="font-size:14px;font-weight:700;letter-spacing:.02em;color:${maroon};text-transform:uppercase;">${opts.brand}</div>
                <h1 style="margin:18px 0 0 0;font-size:23px;line-height:1.3;font-weight:800;color:#111827;">${opts.heading}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 40px 4px 40px;">
                <span style="display:inline-block;background:${opts.pill.bg};color:${opts.pill.color};font-size:13px;font-weight:600;padding:7px 13px;border-radius:999px;">${opts.pill.text}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 40px 8px 40px;font-size:15px;line-height:1.6;color:#374151;">${opts.intro}</td>
            </tr>
            <tr>
              <td style="padding:12px 40px 8px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f3f4f6;border-radius:12px;padding:6px 16px;">
                  ${rows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 8px 40px;">
                <a href="${opts.cta.url}" style="display:inline-block;background:${maroon};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">${opts.cta.label}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 40px 40px;font-size:12px;line-height:1.6;color:#9ca3af;border-top:1px solid #f3f4f6;">
                ${opts.footer ?? `Manage all your bookings anytime from My tours.`}<br />— The ${opts.brand} team
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
