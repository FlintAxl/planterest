# SQLite Cart Persistence (20-point Requirement)

This document explains how SQLite cart persistence was implemented in this project.

## Goal

Implement cart persistence using SQLite so that:
- cart items are saved locally before checkout
- cart items are restored when the app opens
- cart items are deleted after successful checkout
- cart data is isolated per user account (User A cart does not appear for User B)

## Package Used

- `expo-sqlite` (already added in frontend dependencies)

Install command used:

```bash
npx expo install expo-sqlite
```

## How It Works

### 1) SQLite storage layer
A dedicated storage service was added to manage all cart database operations.

File:
- `frontend/assets/common/cart-sqlite.js`

Responsibilities:
- open DB (`planterest.db`)
- create table `cart_state_by_user`
- save cart JSON by `user_id`
- load cart JSON by `user_id`
- clear cart row by `user_id`

### 2) Redux constants
A new action constant was added for cart hydration.

File:
- `frontend/Redux/constants.js`

Added:
- `SET_CART_ITEMS`

### 3) Redux cart actions (with SQLite sync)
Cart actions were converted to thunk actions so they can perform async SQLite writes/reads.

File:
- `frontend/Redux/Actions/cartActions.js`

Updated actions:
- `loadCartFromDatabase(userId)`
- `addToCart(payload, userId)`
- `removeFromCart(payload, userId)`
- `clearCart(userId)`

Behavior:
- add/remove updates Redux first, then persists updated state to SQLite for the active user
- clear removes Redux cart and deletes SQLite data for the active user
- load reads from SQLite and hydrates Redux via `SET_CART_ITEMS`

### 4) Redux reducer hydration support
Reducer now accepts `SET_CART_ITEMS` to replace current cart state with data loaded from SQLite.

File:
- `frontend/Redux/Reducers/cartItems.js`

### 5) App startup and user-switch hydration
A cart hydrator was added so cart data reloads whenever active auth user changes.

File:
- `frontend/App.js`

Behavior:
- if logged in: load cart for `userId`
- if logged out: load `guest` cart
- on account switch/login/logout: cart rehydrates for the current user context

### 6) Product add-to-cart integration
Add-to-cart now passes active `userId` so data is stored for the correct user.

Files:
- `frontend/Screeens/Product/ProductCard.js`
- `frontend/Screeens/Product/SingleProduct.js`

### 7) Cart screen integration
Remove and clear operations now pass active `userId`.

File:
- `frontend/Screeens/Cart/Cart.js`

### 8) Checkout clear behavior
After successful order, cart clear now removes both Redux and user-scoped SQLite cart data.

File:
- `frontend/Screeens/Checkout/Confirm.js`

## Files Edited (Quick Reference)

- `frontend/assets/common/cart-sqlite.js` (new)
- `frontend/Redux/constants.js`
- `frontend/Redux/Actions/cartActions.js`
- `frontend/Redux/Reducers/cartItems.js`
- `frontend/App.js`
- `frontend/Screeens/Product/ProductCard.js`
- `frontend/Screeens/Product/SingleProduct.js`
- `frontend/Screeens/Cart/Cart.js`
- `frontend/Screeens/Checkout/Confirm.js`

## Data Model

Table: `cart_state_by_user`
- `user_id` TEXT PRIMARY KEY
- `data` TEXT (JSON stringified array of cart items)

## Validation Checklist

1. Login as User A, add items, restart app -> User A cart persists.
2. Logout and login as User B -> User B cart is separate (no User A leakage).
3. Switch back to User A -> User A cart still restores.
4. Complete checkout -> current user cart clears.
5. Restart app after checkout -> cart remains empty for that user.

## Notes

- Current remove logic still compares object references in reducer. This works with current flow, but ID-based removal is recommended for long-term robustness.
- Auth token handling in `Context/Store/Auth.js` uses `AsyncStorage.jwt` style access and may need cleanup to `AsyncStorage.getItem` for reliability.
