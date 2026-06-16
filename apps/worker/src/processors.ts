// Job processors. Each is stubbed and ready to be implemented against the documented
// action. They share the DB + Redis with the API process.
import { Worker, type Job } from 'bullmq';
import { connection, QUEUES } from './queues.js';
import { logger } from './logger.js';

function register(name: string, handler: (job: Job) => Promise<void>) {
  const worker = new Worker(name, handler, { connection });
  worker.on('failed', (job, err) => logger.error({ job: job?.id, err }, `${name} failed`));
  worker.on('completed', (job) => logger.debug({ job: job.id }, `${name} completed`));
  return worker;
}

export function startProcessors() {
  register(QUEUES.bookingExpire, async (job) => {
    // TODO: if still REQUESTED, release the Stripe authorization and transition to EXPIRED.
    logger.info({ data: job.data }, 'booking.expire');
  });

  register(QUEUES.bookingAutocomplete, async (job) => {
    // TODO: complete undisputed sessions 48h after their scheduled end; accrue seller balance.
    logger.info({ data: job.data }, 'booking.autocomplete');
  });

  register(QUEUES.reminders, async (job) => {
    // TODO: notify both parties 24h & 1h before virtual sessions.
    logger.info({ data: job.data }, 'reminders');
  });

  register(QUEUES.emailDispatch, async (job) => {
    // TODO: render template + send via SES/Mailgun; handle bounces/complaints.
    logger.info({ data: job.data }, 'email.dispatch');
  });

  register(QUEUES.pushDispatch, async (job) => {
    // TODO: send via Expo Push (FCM/APNs) to the user's device tokens.
    logger.info({ data: job.data }, 'push.dispatch');
  });

  register(QUEUES.webhookProcess, async (job) => {
    // TODO: idempotent Stripe side-effects (dedup already done via webhook_events).
    logger.info({ data: job.data }, 'webhook.process');
  });

  register(QUEUES.campaignSend, async (job) => {
    // TODO: fan-out a push campaign to the chosen segment (all/buyers/guides).
    logger.info({ data: job.data }, 'campaign.send');
  });

  logger.info('Job processors started.');
}
