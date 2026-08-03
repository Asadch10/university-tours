// Device / Expo push-token registration for the mobile app.
// The app calls POST /devices after login (once it has an Expo token) and again
// whenever the token changes; DELETE /devices removes it on logout.
import { Router } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { requireAuth } from '../middleware/auth.js';
import { registerDeviceToken, unregisterDeviceToken } from '../services/push.service.js';

export const devicesRouter = Router();

// Register (or refresh) this device's Expo push token for the signed-in user.
devicesRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { pushToken, platform } = req.body as { pushToken?: string; platform?: string };
    if (!pushToken || typeof pushToken !== 'string') {
      throw new HttpError(400, 'invalid_input', 'pushToken is required');
    }
    const plat = platform === 'ANDROID' ? 'ANDROID' : 'IOS';
    res.json(await registerDeviceToken(req.user!.id, pushToken, plat));
  }),
);

// Unregister a token (logout / permission revoked).
devicesRouter.delete(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { pushToken } = req.body as { pushToken?: string };
    if (!pushToken || typeof pushToken !== 'string') {
      throw new HttpError(400, 'invalid_input', 'pushToken is required');
    }
    res.json(await unregisterDeviceToken(pushToken));
  }),
);
