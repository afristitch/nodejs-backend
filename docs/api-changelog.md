# API Changelog — March 2026

This document summarizes recent backend changes that affect frontend/mobile app integration.

---

## 1. Subscription Enforcement — All Routes Now Gated

**What changed:** Subscription expiration is now enforced across **all** protected routes, not just Orders and Clients. The following modules now return `403` if the org's trial or plan has expired:

| Route Group | Previously | Now |
|---|---|---|
| `POST /api/v1/sms/*` | Open | 🔒 Gated |
| `GET/PUT/DELETE /api/v1/users/*` | Open | 🔒 Gated |
| `GET/PUT /api/v1/profile/me` | Open | 🔒 Gated |
| `PUT /api/v1/organization` | Open | 🔒 Gated |

> **Routes that remain open** (so expired users can still manage their account):
> - `GET /api/v1/organization` — view org info
> - `GET /api/v1/organization/subscription` — check status
> - `GET /api/v1/plans` — view available plans
> - `POST /api/v1/payments/initialize` — initiate payment
> - `POST /api/v1/revenuecat/webhook` — RevenueCat (internal)

**What to do:** The existing error handling for `TRIAL_EXPIRED`, `SUBSCRIPTION_EXPIRED`, and `NO_ACTIVE_SUBSCRIPTION` codes should already cover these new routes. No new error codes were added.

---

## 2. RevenueCat — New Webhook Endpoint

**What changed:** A new public webhook endpoint has been added to receive in-app purchase events from RevenueCat. This replaces the need to use Paystack for mobile subscriptions.

```
POST /api/v1/revenuecat/webhook
```

This is **backend-only** (called by RevenueCat, not the app). No action needed in the frontend unless you are configuring the RevenueCat dashboard.

**How subscription activation now works on mobile:**

1. User purchases a plan via the RevenueCat SDK in the app (no `POST /payments/initialize` call needed for mobile).
2. RevenueCat fires a webhook to our server.
3. The server updates the organization's `subscriptionStatus` to `ACTIVE` and sets `subscriptionEndsAt`.
4. The app polls `GET /api/v1/organization/subscription` to confirm the updated status.

> [!TIP]
> Since webhooks are asynchronous, poll `GET /organization/subscription` once or twice (with a 2-second delay) after a successful RC purchase before redirecting the user.

**The `app_user_id` passed to RevenueCat SDK must be the organization's `_id`.** This is how the backend links the purchase to the right account. Confirm this is set correctly in the mobile app.

**Subscription status values** remain the same:

| Status | Meaning |
|---|---|
| `trialing` | Free trial, check `trialEndsAt` |
| `active` | Paid and active, check `subscriptionEndsAt` |
| `cancelled` | Cancelled, access until `subscriptionEndsAt` |
| `expired` | No access |
| `cancelled` | Cancelled, access until `subscriptionEndsAt` |
| `expired` | No access |

---

## 3. Optional Fields & Proper Logging (Latest)

### Optional Email and Phone Fields
**What changed:** Many optional fields on `Client`, `Order`, and `Organization` can now be sent as empty strings (`""`) from the frontend without causing validation errors.
- **Backend handling:** Empty strings are automatically converted to `null` before saving.
- **Routes updated:** `POST /api/v1/clients`, `PUT /api/v1/organization`, `PUT /api/v1/orders`, etc.

### Proper Logging System
**What changed:** A professional logging system with file rotation has been implemented.
- **Request Logging:** Every API request is now logged with status, timing, and user context.
- **Error Tracking:** Global errors are captured with stack traces.
- **Admin API:** New system routes for platform owners to access logs (requires `SUPER_ADMIN` role).
