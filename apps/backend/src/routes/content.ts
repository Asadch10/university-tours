// 7.8 Public content & app configuration (CMS-driven, served to web & mobile)
import { Router } from 'express';
import { asyncHandler } from '../lib/http.js';
import * as svc from '../services/content.service.js';

export const cmsRouter = Router();

cmsRouter.get('/homepage', asyncHandler(async (_req, res) => {
  res.json(await svc.getHomepage());
}));

cmsRouter.get('/faqs', asyncHandler(async (_req, res) => {
  res.json(await svc.getFaqs());
}));

cmsRouter.get('/pages/:slug', asyncHandler(async (req, res) => {
  res.json(await svc.getPage(req.params['slug'] as string));
}));

cmsRouter.get('/testimonials', asyncHandler(async (_req, res) => {
  res.json(await svc.getTestimonials());
}));

export const appConfigRouter = Router();

appConfigRouter.get('/', asyncHandler(async (_req, res) => {
  res.json(await svc.getAppConfig());
}));
