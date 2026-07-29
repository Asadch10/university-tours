// Public "Contact us" form submission.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../lib/http.js';
import * as svc from '../services/contact.service.js';

export const contactRouter = Router();

// Light abuse guard: a handful of submissions per IP per 15 minutes.
contactRouter.post(
  '/',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }),
  asyncHandler(async (req, res) => {
    const { name, email, topic, message } = req.body as {
      name?: string;
      email?: string;
      topic?: string;
      message?: string;
    };
    res.status(201).json(await svc.createContactMessage({ name, email, topic, message }));
  }),
);
