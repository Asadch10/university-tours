// Mounts the full /api/v1 surface. One versioned contract for all clients (Part I §6).
import { Router } from 'express';
import { authRouter } from './auth.js';
import { usersRouter, sellersRouter, applicationsRouter } from './account.js';
import { schoolsRouter, listingsRouter, searchRouter, configRouter } from './catalog.js';
import { bookingsRouter } from './bookings.js';
import { conversationsRouter } from './engagement.js';
import { cmsRouter, appConfigRouter } from './content.js';
import { adminRouter } from './admin.js';

export const apiV1 = Router();

apiV1.use('/auth', authRouter);
apiV1.use('/users', usersRouter);
apiV1.use('/sellers', sellersRouter);
apiV1.use('/applications', applicationsRouter);
apiV1.use('/schools', schoolsRouter);
apiV1.use('/listings', listingsRouter);
apiV1.use('/search', searchRouter);
apiV1.use('/config', configRouter);
apiV1.use('/bookings', bookingsRouter);
apiV1.use('/conversations', conversationsRouter);
apiV1.use('/cms', cmsRouter);
apiV1.use('/app-config', appConfigRouter);
apiV1.use('/admin', adminRouter);
