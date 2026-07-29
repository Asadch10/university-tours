// Contact-us messages: public submission + admin read.
import { prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public: store a message submitted from the website contact form. */
export async function createContactMessage(input: {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
}) {
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim();
  const topic = (input.topic ?? '').trim();
  const message = (input.message ?? '').trim();

  if (!name) throw new HttpError(400, 'validation_error', 'Please enter your name.');
  if (!email || !EMAIL_RE.test(email)) throw new HttpError(400, 'validation_error', 'Please enter a valid email address.');
  if (!topic) throw new HttpError(400, 'validation_error', 'Please choose a topic.');
  if (!message) throw new HttpError(400, 'validation_error', 'Please enter a message.');

  const row = await prisma.contactMessage.create({
    data: {
      name: name.slice(0, 200),
      email: email.slice(0, 200),
      topic: topic.slice(0, 200),
      message: message.slice(0, 5000),
    },
    select: { id: true },
  });
  return { ok: true as const, id: row.id };
}

/** Admin: paged list of submitted messages (newest first). */
export async function listContactMessages(opts: { q?: string; status?: string; page?: number; limit?: number }) {
  const { q, status, page = 1, limit = 50 } = opts;
  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { topic: { contains: q } },
      { message: { contains: q } },
    ];
  }
  const [data, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({ where }),
  ]);
  return { data, total, page, limit };
}

/** Admin: one message by id. */
export async function getContactMessage(id: string) {
  const row = await prisma.contactMessage.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, 'not_found', 'Message not found');
  return row;
}

/** Admin: mark a message read/new. */
export async function updateContactMessage(id: string, data: { status?: string }) {
  const row = await prisma.contactMessage.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, 'not_found', 'Message not found');
  const status = data.status === 'read' ? 'read' : data.status === 'new' ? 'new' : row.status;
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

/** Admin: delete a message. */
export async function deleteContactMessage(id: string) {
  const row = await prisma.contactMessage.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, 'not_found', 'Message not found');
  await prisma.contactMessage.delete({ where: { id } });
  return { ok: true as const };
}
