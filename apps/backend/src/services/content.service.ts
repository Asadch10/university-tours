import { prisma } from '@ucpt/db';
import { HttpError } from '../lib/http.js';

export async function getHomepage() {
  const blocks = await prisma.cmsBlock.findMany({ where: { type: 'HOMEPAGE', published: true } });
  return blocks;
}

export async function getFaqs() {
  return prisma.cmsBlock.findMany({ where: { type: 'FAQ', published: true }, orderBy: { key: 'asc' } });
}

export async function getPage(slug: string) {
  const block = await prisma.cmsBlock.findFirst({ where: { key: slug, type: 'PAGE', published: true } });
  if (!block) throw new HttpError(404, 'not_found', 'Page not found');
  return block;
}

export async function getTestimonials() {
  return prisma.cmsBlock.findMany({ where: { type: 'TESTIMONIAL', published: true }, orderBy: { key: 'asc' } });
}

export async function getAppConfig() {
  const config = await prisma.appConfig.findFirst();
  if (!config) throw new HttpError(404, 'not_found', 'App config not found');
  return {
    minSupportedVersion: config.minSupportedVersion,
    forceUpdateMessage: config.forceUpdateMessage,
    maintenanceBanner: config.maintenanceBanner,
    featureFlags: config.featureFlagsJson,
  };
}
