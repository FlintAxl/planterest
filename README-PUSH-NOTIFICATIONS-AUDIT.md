# Push Notification + JWT/SQLite Implementation Audit

This document maps your requested features to the current implementation in this repo.

## Requirement Check

### 1) Send a push notification after order update (10 pts)
Status: IMPLEMENTED

Where implemented:
- `backend/routes/orders.js`
- `backend/helpers/push-notifications.js`

How it works:
1. `PUT /orders/:id` updates order status in `backend/routes/orders.js`.
2. After update, backend loads the user's `expoPushToken`.
3. It calls `sendOrderStatusNotification(...)` from `backend/helpers/push-notifications.js`.
4. Notification payload includes:
   - `orderId`
   - `status`
   - `screen: "Order Details"`

## 2) Click notification to open order details (10 pts)
Status: IMPLEMENTED

Where implemented:
- `frontend/App.js`
- `frontend/Navigators/navigationRef.js`
- `frontend/Navigators/UserNavigator.js`

How it works:
1. `App.js` registers `Notifications.addNotificationResponseReceivedListener(...)`.
2. On tap, it reads `response.notification.request.content.data.orderId`.
3. If user is authenticated, it fetches order details from backend.
4. It calls `navigateToOrderDetails(...)` in `navigationRef.js`.
5. Navigation targets stack screen `Order Details` (declared in `UserNavigator.js`).

Also handled:
- App launch from notification (`getLastNotificationResponseAsync`).
- Duplicate notification tap protection with a handled-ID Set.

## 3) Unit 2 node backend functions + JWT tokens stored on SQLite
Status: PARTIALLY IMPLEMENTED

Implemented parts:
- Backend functions/helpers exist and are used:
  - `backend/helpers/push-notifications.js`
  - `backend/helpers/jwt.js`
- JWT auth middleware exists (`express-jwt`) in `backend/helpers/jwt.js`.
- Login issues JWT in `backend/routes/users.js` (`POST /users/login`).

Not implemented as stated:
- JWT is NOT stored in SQLite.
- JWT is stored in:
  - `expo-secure-store` (primary)
  - `AsyncStorage` (legacy fallback)
- This logic is in `frontend/assets/common/token-storage.js`.

SQLite is used, but for cart state only:
- `frontend/assets/common/cart-sqlite.js`

## 4) Push token saved on user model + update/remove stale tokens (20 pts)
Status: IMPLEMENTED

Where implemented:
- Model fields: `backend/models/user.js`
  - `expoPushToken`
  - `expoPushTokenUpdatedAt`
- Save/update token endpoint: `PUT /users/:id/push-token` in `backend/routes/users.js`
- Remove token endpoint: `DELETE /users/:id/push-token` in `backend/routes/users.js`
- Frontend registration sync: `frontend/assets/common/push-notifications.js`
- Frontend token removal on logout: `frontend/Context/Actions/Auth.actions.js`
- Remove stale token on Expo error `DeviceNotRegistered`:
  - Detected in `backend/helpers/push-notifications.js`
  - Cleared in `backend/routes/orders.js` after send result

How stale-token handling works today:
1. If Expo rejects token format or returns `DeviceNotRegistered`, backend marks token removable.
2. Order update flow clears token from user record.
3. Client also clears server token on logout via `DELETE /users/:id/push-token`.

## End-to-end Flow Summary

1. User logs in and gets JWT (`POST /users/login`).
2. Frontend stores JWT in SecureStore (`token-storage.js`).
3. Frontend gets Expo push token and syncs to backend (`registerAndSyncPushToken`).
4. Admin/user updates order status (`PUT /orders/:id`).
5. Backend sends push via Expo SDK.
6. User taps notification.
7. App fetches order by `orderId` and navigates to `Order Details`.

## Notes / Gaps

- Requirement text says JWT should be stored on SQLite.
- Current implementation stores JWT in SecureStore + AsyncStorage, not SQLite.
- If your grading strictly requires JWT-in-SQLite, you still need to add that layer.

## Quick Verification Checklist

- Update an order status from backend/admin screen.
- Confirm notification arrives on a physical device (dev build, not Expo Go for Android remote push).
- Tap notification and confirm app opens `Order Details` for that specific order.
- Logout and verify token removal endpoint is called.
- Test with an invalid or unregistered token and verify backend clears stale token.
