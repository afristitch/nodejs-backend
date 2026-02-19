# File Upload Guide

## Upload Endpoint

**`POST /api/v1/upload`** — Upload an image and get back a Cloudinary URL.

### Request

- **Auth**: Bearer token required
- **Content-Type**: `multipart/form-data`
- **Field name**: `image`
- **Accepted types**: JPEG, PNG, WebP
- **Max size**: 5 MB
- **Query params**:
  - `folder` (optional) — Cloudinary folder, defaults to `tailor/uploads`

### Example (cURL)

```bash
curl -X POST http://localhost:5000/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/photo.jpg"
```

### Response

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/xxx/image/upload/v123/tailor/uploads/userId_1234.jpg",
    "publicId": "tailor/uploads/userId_1234"
  }
}
```

---

## Using the URL

Once you have the `url` from the upload response, pass it as a string to any endpoint that accepts an image URL field:

| Endpoint | Field | Description |
|---|---|---|
| `POST /api/v1/orders` | `clothImageUrl` | Cloth/fabric reference image |
| `PUT /api/v1/orders/:id` | `clothImageUrl` | Update cloth image |
| `PUT /api/v1/profile` | `photoUrl` | User profile photo |
| `PUT /api/v1/organization` | `logoUrl` | Organization logo |
| `POST /api/v1/clients` | `photoUrl` | Client photo |
| `PUT /api/v1/clients/:id` | `photoUrl` | Update client photo |

### Example — Create Order with Cloth Image

```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "abc-123",
    "amount": 5000,
    "clothImageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/tailor/uploads/userId_1234.jpg",
    "clothSize": "XL"
  }'
```

### Flow

```
1. Frontend picks an image
2. POST /api/v1/upload  →  get { url, publicId }
3. Use the url in any create/update request body
```
