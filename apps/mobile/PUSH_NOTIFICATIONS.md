# Push Notifications

End-to-end push notifications for the UCPT app, built on the **Expo Push Service**
(`expo-notifications`). No bare React Native / raw Firebase SDK is used — Expo is a
convenience layer that relays through **FCM** (Android) and **APNs** (iOS).

- **Android: ✅ working** (Firebase/FCM configured — see below)
- **iOS: not yet set up** — code is ready, needs a paid Apple Developer account (see [iOS](#ios-setup))

---

## How it works

```
Backend event (booking / approval / broadcast)
        │  looks up the user's Expo push tokens (Device table)
        ▼
Expo Push API  (exp.host, via expo-server-sdk)
        │  Expo authenticates to the platform using credentials stored in EAS
        ├──────────────► FCM (Android)  ─► phone 🔔
        └──────────────► APNs (iOS)     ─► phone 🔔
```

Key idea: **the app talks to the Expo Push Service, and Expo delivers via FCM/APNs.**
The FCM key (Android) and APNs key (iOS) live in the **EAS project credentials**, never
in this repo. That's why there are no secrets committed here.

> ⚠️ **Expo Go cannot receive remote push** (removed in SDK 53+). You must install a
> **build** (dev/preview/production). In Expo Go the app falls back to a *local* test
> notification so you can still see one render.

---

## Notification events

| Trigger | Recipient | Backend location |
|---|---|---|
| Guest books a guide | the **guide** | `booking.service.ts` → `notifyNewBooking` |
| Guide accepts / declines / completes | the **guest** | `booking.service.ts` → `notifyStatusChange` |
| Admin approves a listing | the **listing owner** | `admin.service.ts` → `moderateListing` (published branch) |
| Admin broadcast (App Config) | **all devices** | `admin.service.ts` → `broadcastAppPush` |
| Admin push campaign (by segment) | ALL / BUYERS / GUIDES | `admin.service.ts` → `sendCampaign` |

A tapped notification carries `data.type` (`booking` / `listing` / `broadcast` / …);
the app routes on it (`App.tsx` → `routeFromNotification`, e.g. `booking` → My Tours).

---

## Architecture

### Backend (`apps/backend`)
- **`src/services/push.service.ts`** — the reusable send funnel. Mirrors `mailer.service.ts`:
  - `sendPushToUsers(userIds, { title, body, data })`
  - `broadcastPush({ title, body, data })`
  - `registerDeviceToken(userId, token, platform)` / `unregisterDeviceToken(token)`
  - Respects the `AppConfig.pushNotificationsEnabled` master switch (15s-cached).
  - Prunes tokens Expo reports as `DeviceNotRegistered` (dead) from the DB.
  - Never throws — a push failure can never break the request that triggered it.
- **`src/routes/devices.ts`** — `POST /api/v1/devices` (register/refresh) and
  `DELETE /api/v1/devices` (unregister), both `requireAuth`.
- **Admin broadcast** — `POST /api/v1/admin/app-config/broadcast-push` (`appconfig.manage`).
- **DB** — Expo tokens live in the existing **`Device`** model (`push_token` is `@unique`).

### Mobile (`apps/mobile`)
- **`src/api/push.ts`** — the client:
  - `registerForPush()` — asks permission, calls `getExpoPushTokenAsync({ projectId })`,
    POSTs the token to `/devices`. Idempotent; no-ops on simulators / denied permission /
    Expo Go / missing projectId.
  - `unregisterForPush()` — removes the token on logout.
  - `presentLocalNotification()` — a local notification (used as the Expo Go fallback test).
- **`App.tsx`** — foreground handler, tap routing, cold-start handling, and re-register on app open.
- **Registration is triggered** on: login (`AuthScreen`), onboarding finish (`OnboardingScreen`),
  and every app open while signed in (`App.tsx`). Unregister on logout (`SettingsScreen`).

### Config
- `app.json`: plugins `expo-notifications`, `expo-build-properties` (cleartext HTTP for local
  testing), `expo-font`; `extra.eas.projectId`; `android.googleServicesFile`.
- `eas.json`: build profiles; `preview.env.EXPO_PUBLIC_API_BASE_URL` (the API the build talks to).

---

## Android setup (done)

What made Android work, in order:

1. **Firebase project** created (`ucpt-672a6`).
2. **FCM V1 service-account key** → uploaded to EAS:
   ```
   eas credentials -p android
   → Google Service Account
   → Manage your Google Service Account Key for Push Notifications (FCM V1)
   → Set up a Google Service Account Key…  (pick the downloaded JSON)
   ```
   (This is the *sending* credential — Expo uses it to deliver to FCM. Lives in EAS only.)
3. **Register the Android app** in Firebase with package **`com.ucpt.mobile`**.
4. **`google-services.json`** (the *client* Firebase config) downloaded from Firebase,
   placed at `apps/mobile/google-services.json`, and referenced in `app.json`:
   ```json
   "android": { "googleServicesFile": "./google-services.json" }
   ```
   Without this the app can't initialize Firebase → `getExpoPushTokenAsync` fails silently
   → no token → empty `devices` table. **Must NOT be gitignored** (EAS skips gitignored files).
5. **`expo-font`** installed (expo-doctor flagged it — `@expo/vector-icons` needs it or the
   standalone build can crash).
6. Build: `eas build -p android --profile preview` → scan QR → install APK.

---

## Local testing

Push delivery is app↔Google, independent of which API server stores the token — so you can
test against a **local backend**:

- The **built APK** reads its API URL from **`eas.json` → `preview.env`** and
  **`app.json` → `extra.apiBaseUrl`** (NOT `.env`, which is gitignored and never uploaded to EAS).
  It's set to the Mac's LAN IP, e.g. `http://192.168.18.43:4000`.
- Requirements: phone on the **same Wi-Fi**, backend **running**, and — because it's a release
  APK hitting plain `http://` — **cleartext HTTP** is enabled via `expo-build-properties`.
- If the Mac's IP changes, update it in `eas.json` + `app.json` and rebuild.

**Verify a token registered** (after installing + logging in on the phone):
```sql
SELECT user_id, platform, LEFT(push_token,25), created_at FROM devices ORDER BY created_at DESC;
```
Non-empty = registration works. Then send a broadcast from **Admin → App Config → Push notifications**.

### Master switch
`AppConfig.pushNotificationsEnabled` (Admin → App Config → Push notifications toggle) gates all
sends. Off = nothing is sent.

---

## iOS setup

The **mobile code already works on iOS** — `getExpoPushTokenAsync` returns an
`ExponentPushToken`, `Platform.OS === 'ios'` registers as platform `IOS`, and the backend sends
the same way. **No Firebase / `google-services.json` for iOS** — Expo relays to APNs directly.

What iOS needs that Android didn't:

1. **A paid Apple Developer account** ($99/yr). There is no free path to on-device iOS push.
2. **APNs key in EAS** — EAS generates and uploads it for you once you're logged into Apple:
   ```
   eas credentials -p ios
   → Push Notifications: Set up your APNs key
   ```
   (Or `eas build -p ios` will prompt to set this up automatically.)
3. **A physical iPhone registered for the build** (internal/ad-hoc distribution):
   ```
   eas device:create        # register the device UDID
   eas build -p ios --profile preview
   ```
   Then install via the QR/link (Simulator can't receive remote push; use a real device).
4. `bundleIdentifier` is already set (`com.ucpt.mobile`); iOS push entitlement is added by the
   `expo-notifications` plugin during the build.

No app code changes are required — only the Apple credentials + an iOS build.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `devices` table empty after login | `getExpoPushTokenAsync` failed | Ensure `google-services.json` is present + referenced + not gitignored; Android app registered in Firebase |
| `[push] registration skipped: No "projectId"` | missing EAS projectId | `eas init` / `extra.eas.projectId` in app.json |
| `[push] Skipped — … Expo Go` | running in Expo Go | install a build, not Expo Go |
| Broadcast returns 200 but nothing arrives | 0 registered devices, or push disabled | check `devices` table + `pushNotificationsEnabled` |
| App can't reach backend in APK | wrong URL baked in | set LAN IP in `eas.json` env; same Wi-Fi; backend running |
| App crashes on standalone build | missing `expo-font` peer dep | `npx expo install expo-font` |

To read the exact on-device reason, connect the phone via USB (USB debugging on) and:
```
adb logcat | grep -iE "firebase|fcm|expo|notification|push"
```
