// Background processing & realtime (Part I §10). Queue names are the contract
// shared with the API process, which acts as the producer.
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

export const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const QUEUES = {
  bookingExpire: 'booking.expire', // release authorization on unanswered requests (scheduled at request)
  bookingAutocomplete: 'booking.autocomplete', // complete undisputed sessions 48h after end
  reminders: 'reminders', // 24h & 1h before virtual sessions
  emailDispatch: 'email.dispatch', // templated transactional email
  pushDispatch: 'push.dispatch', // templated push
  webhookProcess: 'webhook.process', // idempotent Stripe side-effects
  campaignSend: 'campaign.send', // fan-out push campaign to a segment
} as const;

export const bookingExpireQueue = new Queue(QUEUES.bookingExpire, { connection });
export const bookingAutocompleteQueue = new Queue(QUEUES.bookingAutocomplete, { connection });
export const remindersQueue = new Queue(QUEUES.reminders, { connection });
export const emailQueue = new Queue(QUEUES.emailDispatch, { connection });
export const pushQueue = new Queue(QUEUES.pushDispatch, { connection });
export const webhookQueue = new Queue(QUEUES.webhookProcess, { connection });
export const campaignQueue = new Queue(QUEUES.campaignSend, { connection });
