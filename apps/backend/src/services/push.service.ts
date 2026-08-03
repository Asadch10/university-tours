// Expo push notification service — the single funnel for all mobile push.
//
// Structured to mirror mailer.service.ts so it's reusable for any future
// notification type: callers pass a userId (or a set of them) plus a title/body,
// and this module resolves the user's registered Expo tokens, respects the
// `AppConfig.pushNotificationsEnabled` master switch, sends via Expo's push API,
// and prunes tokens Expo reports as no longer valid. A push failure is always
// swallowed (logged) so it can never break the request that triggered it.
import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from '@ucpt/db';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

// ── Master switch (DB-cached for 15s, same pattern as the mailer) ──────────────
let switchCache: { on: boolean; at: number } | null = null;

async function pushEnabled(): Promise<boolean> {
  const now = Date.now();
  if (switchCache && now - switchCache.at < 15_000) return switchCache.on;
  try {
    const cfg = await prisma.appConfig.findFirst({ select: { pushNotificationsEnabled: true } });
    const on = cfg?.pushNotificationsEnabled ?? true; // default on if unconfigured
    switchCache = { on, at: now };
    return on;
  } catch {
    return true; // fail open
  }
}

// ── Lazily-constructed Expo client ─────────────────────────────────────────────
let expo: Expo | null = null;
function client(): Expo {
  if (!expo) expo = new Expo(config.EXPO_ACCESS_TOKEN ? { accessToken: config.EXPO_ACCESS_TOKEN } : {});
  return expo;
}

/** Extra JSON payload delivered with a push — used by the app to deep-link on tap. */
export type PushData = Record<string, string>;

export interface PushMessage {
  title: string;
  body: string;
  data?: PushData;
}

/**
 * Remove tokens Expo has told us are dead. Expo returns per-message tickets; a
 * ticket with status 'error' and details.error 'DeviceNotRegistered' means the
 * token is permanently invalid (app uninstalled / permission revoked) and must
 * not be used again — so we delete it.
 */
async function pruneInvalidTokens(tokens: string[], tickets: ExpoPushTicket[]): Promise<void> {
  const dead: string[] = [];
  tickets.forEach((ticket, i) => {
    if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered' && tokens[i]) {
      dead.push(tokens[i]!);
    }
  });
  if (dead.length === 0) return;
  await prisma.device
    .deleteMany({ where: { pushToken: { in: dead } } })
    .catch((err) => logger.error({ err }, 'Failed to prune dead push tokens'));
  logger.info({ count: dead.length }, 'Pruned dead push tokens');
}

/** Low-level: send one message to an explicit list of Expo push tokens. */
async function sendToTokens(tokens: string[], msg: PushMessage): Promise<void> {
  const valid = [...new Set(tokens)].filter((t) => Expo.isExpoPushToken(t));
  if (valid.length === 0) return;

  const messages: ExpoPushMessage[] = valid.map((to) => ({
    to,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    ...(msg.data ? { data: msg.data } : {}),
  }));

  const expoClient = client();
  const chunks = expoClient.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      tickets.push(...(await expoClient.sendPushNotificationsAsync(chunk)));
    } catch (err) {
      logger.error({ err }, 'Expo push chunk send failed');
    }
  }
  await pruneInvalidTokens(valid, tickets);
}

/**
 * Send a push to one or more users (by userId). Resolves each user's registered
 * devices, honours the master switch, and best-effort delivers. Never throws.
 */
export async function sendPushToUsers(userIds: string | string[], msg: PushMessage): Promise<void> {
  try {
    if (!(await pushEnabled())) {
      logger.info({ title: msg.title }, 'Push skipped — notifications disabled in app config');
      return;
    }
    const ids = [...new Set(Array.isArray(userIds) ? userIds : [userIds])].filter(Boolean);
    if (ids.length === 0) return;
    const devices = await prisma.device.findMany({
      where: { userId: { in: ids } },
      select: { pushToken: true },
    });
    if (devices.length === 0) return;
    await sendToTokens(
      devices.map((d) => d.pushToken),
      msg,
    );
  } catch (err) {
    logger.error({ err, title: msg.title }, 'sendPushToUsers failed');
  }
}

/**
 * Broadcast a push to every registered device (all mobile users). Used by the
 * admin App Config broadcast composer. Returns how many devices were targeted.
 */
export async function broadcastPush(msg: PushMessage): Promise<{ devices: number }> {
  try {
    if (!(await pushEnabled())) {
      logger.info({ title: msg.title }, 'Broadcast skipped — notifications disabled in app config');
      return { devices: 0 };
    }
    const devices = await prisma.device.findMany({ select: { pushToken: true } });
    if (devices.length === 0) return { devices: 0 };
    await sendToTokens(
      devices.map((d) => d.pushToken),
      msg,
    );
    return { devices: devices.length };
  } catch (err) {
    logger.error({ err, title: msg.title }, 'broadcastPush failed');
    return { devices: 0 };
  }
}

// ── Token registration (called by the mobile app after login) ──────────────────

/**
 * Upsert a device's Expo push token for a user. Tokens are globally unique, so
 * if the same token was previously registered to another user (shared device),
 * it's re-pointed to the current user.
 */
export async function registerDeviceToken(
  userId: string,
  pushToken: string,
  platform: 'IOS' | 'ANDROID',
): Promise<{ ok: true }> {
  if (!Expo.isExpoPushToken(pushToken)) {
    // Non-fatal: log and no-op so the client isn't blocked by a bad token.
    logger.warn({ userId }, 'Ignoring non-Expo push token on register');
    return { ok: true };
  }
  await prisma.device.upsert({
    where: { pushToken },
    update: { userId, platform },
    create: { userId, pushToken, platform },
  });
  return { ok: true };
}

/** Remove a device token (called on logout / when permission is revoked). */
export async function unregisterDeviceToken(pushToken: string): Promise<{ ok: true }> {
  await prisma.device.deleteMany({ where: { pushToken } });
  return { ok: true };
}
