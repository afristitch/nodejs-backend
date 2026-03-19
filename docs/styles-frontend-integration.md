# Frontend Integration Guide: Style Gallery

This guide explains how to interact with the Style Gallery API and how to link styles to orders.

## 1. Fetching Styles

Styles can be fetched with pagination and optional filtering by gender.

**Endpoint:** `GET /api/v1/styles`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)
- `gender`: Filter by `male`, `female`, or `unisex`
- `search`: Search by name or description (text search)

**Response Structure:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "uuid-string",
      "name": "Classic Suit",
      "gender": "male",
      "imageUrl": "https://...",
      "organizationId": "org-uuid" // null for global styles
    }
  ],
  "pagination": { "total": 1, "page": 1, "totalPages": 1, ... }
}
```

## 2. Creating/Updating Orders with a Style

When creating or updating an order, you can optionally include a `styleId`.

**Endpoint:** `POST /api/v1/orders` or `PUT /api/v1/orders/:id`

**Request Body:**
```json
{
  "clientId": "client-uuid",
  "amount": 500,
  "styleId": "style-uuid-from-gallery", 
  "clothSize": "L",
  "notes": "..."
}
```

## 3. Updating a Style for an Order

You can change the style associated with an order at any time by sending a new `styleId` in a `PUT` request. To remove the style association, send `styleId: null`.

**Endpoint:** `PUT /api/v1/orders/:id`

**Request Body:**
```json
{
  "styleId": "new-style-uuid" // or null to remove
}
```

## 4. Displaying Style Info in Orders

The `style` field in order responses is automatically populated with the style object from the gallery.

**Endpoint:** `GET /api/v1/orders/:id`

**Response Fragment:**
```json
{
  "status": "success",
  "data": {
    "_id": "order-uuid",
    "orderNumber": "ORD-001",
    "styleId": "style-uuid",
    "style": {
      "_id": "style-uuid",
      "name": "Classic Suit",
      "imageUrl": "https://...",
      "gender": "male"
    },
    ...
  }
}
```

> [!NOTE]
> For **Global Styles**, the `organizationId` will be `null`. Only Super Admins can create these, but all organizations can view and use them.
