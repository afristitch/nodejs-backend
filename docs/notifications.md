# Push & In-App Notifications Integration Guide

This guide details how to implement notifications in the mobile app using the new Firebase backend.

## 1. Firebase Setup (Mobile)
Ensure your mobile app is configured with the standard Firebase SDK for iOS/Android.

## 2. Registering Device Tokens
After a user logs in, you **must** register their FCM device token with the backend. This allows the backend to know where to send push notifications.

- **Endpoint**: `POST /api/v1/notifications/device-tokens`
- **Auth**: Required (Bearer Token)
- **Body**:
```json
{
  "token": "YOUR_FCM_DEVICE_TOKEN",
  "platform": "android" 
}
```
*Platform options: `ios`, `android`, `web`*

### Unregistering (Logout)
When a user logs out, you should remove the token to stop receiving notifications for that device.
- **Endpoint**: `DELETE /api/v1/notifications/device-tokens/:token`

---

## 3. Fetching Notification History (In-App)
The backend maintains a persistent history of notifications. Use this to populate a "Notifications" screen.

- **Endpoint**: `GET /api/v1/notifications`
- **Query Params**: `page` (default: 1), `limit` (default: 20)
- **Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "uuid",
        "title": "Order Status Updated",
        "message": "Order #1024 is now COMPLETED.",
        "type": "ORDER_STATUS_UPDATED",
        "isRead": false,
        "data": { "orderId": "..." },
        "createdAt": "2026-03-07T..."
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

## 4. Marking as Read
To clear notification badges or mark them as seen:

- **Single**: `PATCH /api/v1/notifications/:id/read`
- **All**: `PATCH /api/v1/notifications/read-all`

---

## 5. Current Notification Triggers
The backend currently triggers notifications for the following events:

1.  **`ORDER_CREATED`**: Sent when a new order is successfully saved.
2.  **`ORDER_STATUS_UPDATED`**: Sent when an order status changes (e.g., Pending -> Completed).
3.  **`PAYMENT_RECEIVED`**: Sent when a payment is recorded against an order.

### Handling Payload Data
Every notification includes a `data` object with relevant IDs (e.g., `orderId`). You can use this to navigate the user directly to the relevant screen when they tap a push notification.
