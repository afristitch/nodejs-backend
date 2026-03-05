# SewDigital: Frontend Development & Integration Guide

This guide provides a comprehensive overview of the SewDigital backend architecture, API endpoints, and data models to assist in generating a professional, full-featured web application.

## 🏗️ System Architecture

- **Backend**: Node.js / Express (TypeScript)
- **Database**: MongoDB (Mongoose)
- **Multi-tenancy**: Organization-based data isolation. Every user and resource belongs to an `organizationId`.
- **Authentication**: JWT-based (Access + Refresh tokens).
- **Communication**: Resend for emails (Verification, Passwords, Credentials).
- **Storage**: Cloudinary for image processing and hosting.

## 👥 User Roles & Permissions

1.  **ORG_ADMIN**: 
    - Full control over organization settings and branding.
    - User management (Create/Edit/Delete staff).
    - Access to financial reports and high-level summaries.
2.  **STAFF**: 
    - Day-to-day operations: Client management, Measurements, Orders.
    - Cannot access financial reports or manage other users.

## 📡 Core API Endpoints

All protected routes require `Authorization: Bearer <access_token>`.

### 🔑 Authentication (`/api/v1/auth`)
- `POST /register`: Initial signup (creates Organization + ORG_ADMIN).
- `POST /login`: Returns `user`, `accessToken`, `refreshToken`, and `organization`.
- `GET /verify-email/:token`: Activates account.
- `POST /request-password-reset`: Sends reset email.
- `POST /reset-password/:token`: Sets new password.
- `POST /refresh-token`: Rotates access/refresh tokens.

### 👤 Profile & Users (`/api/v1/profile`, `/api/v1/users`)
- `GET /profile/me`: Get current logged-in user details.
- `PUT /profile/me`: Update personal info (name, photoUrl).
- `GET /users`: List all staff in the organization (Admin only).
- `POST /users`: Create new staff (Sends credentials email automatically).

### 🏢 Organization (`/api/v1/organization`)
- `GET /`: Get organization details (name, logoUrl, etc.).
- `PUT /`: Update business info (Admin only).
- `GET /subscription`: Get current status, trial end date, and days remaining.

### 💳 Payments & Subscriptions (`/api/v1/payments`)
- `POST /initialize`: Returns a Paystack `authorization_url`. 
    - **Body**: `{ "callbackUrl": "sewdigital://subscription/verify" }` (optional, use deep links for mobile).
- `POST /webhook`: (Internal use) Receives payment confirmations from Paystack.



### 📝 Measurement Templates (`/api/v1/measurements/templates`)
Tailors can define templates (e.g., "Men's Suit") with custom fields (e.g., "Chest", "Waist").
- `GET /`: List all templates.
- `POST /`: Create a new measurement schema.

### 🧵 Client & Measurement Flow
- **Clients**: `GET /clients` (with search), `POST /clients`.
- **Measurements**: `POST /measurements` (link a client + template + values).

### 🏷️ Order Management (`/api/v1/orders`)
- `GET /`: Paginated list with status filters (`pending`, `in-progress`, `delivered`, etc.).
- `POST /`: Create an order with cloth images and initial payment.
- `PATCH /:id/status`: Update workflow state.
- `PATCH /:id/payment`: Add payment records (updates `amountPaid` and `balance`).
- `GET /reports/financial`: Revenue summaries (Admin only).

### 🖼️ File Upload (`/api/v1/upload`)
- `POST /`: Uploads `multipart/form-data` to Cloudinary. Returns `url` and `publicId`.

## 💎 Subscription & trial Flow

### 1. The 7-Day Trial
Every new organization starts on a **7-day free trial**. You can check the remaining days by calling `GET /api/v1/organization/subscription`.

### 2. Handling Expiration (HTTP 403)
If a trial or subscription expires, the backend will return a `403 Forbidden` on core resource routes (Orders, Clients, etc.) with a specific error code:
- `TRIAL_EXPIRED`: Redirect user to a "Pricing/Upgrade" page.
- `NO_ACTIVE_SUBSCRIPTION`: Redirect user to subscribe.

Example Error Response:
```json
{
    "success": false,
    "message": "Free trial has expired. Please subscribe to continue.",
    "code": "TRIAL_EXPIRED"
}
```

### 3. Implementing the Upgrade Flow (Mobile)
1.  **Initialize**: Call `POST /api/v1/payments/initialize` with a `callbackUrl` (e.g., `sewdigital://subscription/verify`).
2.  **Open Browser**: Use `expo-web-browser` (React Native/Expo) or a system browser to open the `authorization_url`.
3.  **Payment**: User completes payment on Paystack's page.
4.  **Deep Link**: After payment, Paystack redirects the browser, which triggers your app's deep link to return the user to the app.
5.  **Refresh**: Once the user is back in the app, call `GET /api/v1/organization/subscription` to fetch the updated status.

> [!TIP]
> Since webhooks are asynchronous, the status might not update instantly. If it's still `trialing`, wait 2 seconds and pull again.



## 📦 Data Models (TypeScript Interfaces)

Refer to `src/types/index.ts` for full definitions. Key entities include:

```typescript
interface IOrder {
    orderNumber: string;
    status: 'pending' | 'in-progress' | 'fitting' | 'completed' | 'delivered';
    amount: number;
    amountPaid: number;
    balance: number; // Virtual: amount - amountPaid
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    clothImageUrl?: string;
    dueDate?: Date;
}

interface IClient {
    name: string;
    phone: string;
    photoUrl?: string;
}

interface IMeasurementTemplate {
    name: string; // e.g., "Traditional Kaftan"
    fields: { name: string; unit?: string }[];
}
```

## 🎨 Design Expectations

The frontend should feel **premium and modern**:
- **Branding**: Use the `LOGO_URL` from the backend for the navbar/sidebar.
- **Workflow**: Visual progress bars for Order status.
- **Dashboard**: High-level stats (Total Clients, Orders, Revenue) for Admins.
- **Responsiveness**: Tailors may use this on tablets or phones in the shop.

## 🚀 How to Prompt Antigravity for the Web App
1. Provide this backend repository for context.
2. Mention the `FRONTEND_INTEGRATION_GUIDE.md` for API specifications.
3. Request a **Vite/React** or **Next.js** setup with a modern UI library (like Tailwind CSS) and a clean, luxury aesthetic fitting for a bespoke tailoring service.
