# Tailor & Dressmaker Management API

A production-ready REST API for managing tailor and dressmaker businesses. Built with Node.js, Express, MongoDB, and JWT authentication.

## 🎯 Features

- **Multi-tenant Architecture** - Each organization's data is isolated
- **JWT Authentication** - Access + refresh token system
- **Role-Based Access Control** - ORG_ADMIN and STAFF roles
- **Email Verification** - Signed token-based email verification
- **Password Reset** - Secure password reset via email
- **Client Management** - Full CRUD with soft delete
- **Measurement Templates** - Reusable measurement field templates
- **Measurement Records** - Track client measurements
- **Order Management** - Complete order lifecycle with status tracking
- **Financial Reporting** - Admin-only financial summaries
- **Search & Pagination** - Efficient data retrieval
- **Input Validation** - Request validation on all endpoints
- **Error Handling** - Consistent error responses

## 📁 Project Structure

```
tailor-api-node/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Organization.js      # Organization schema
│   │   ├── User.js              # User schema
│   │   ├── Client.js            # Client schema
│   │   ├── MeasurementTemplate.js
│   │   ├── Measurement.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── client.routes.js
│   │   ├── measurement.routes.js
│   │   ├── order.routes.js
│   │   ├── organization.routes.js
│   │   └── index.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── measurement.controller.js
│   │   ├── order.controller.js
│   │   └── organization.controller.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── client.service.js
│   │   ├── measurement.service.js
│   │   ├── order.service.js
│   │   └── organization.service.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   ├── organization.middleware.js
│   │   ├── error.middleware.js
│   │   └── validate.middleware.js
│   ├── utils/
│   │   ├── jwt.js               # JWT utilities
│   │   ├── email.js             # Email service
│   │   ├── response.js          # Response formatters
│   │   └── pagination.js        # Pagination helpers
│   ├── app.js                   # Express app setup
│   └── server.js                # Server entry point
├── postman/
│   └── Tailor-API.postman_collection.json
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tailor-api-node
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the following:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_ACCESS_SECRET` - Random string for access tokens
   - `JWT_REFRESH_SECRET` - Random string for refresh tokens
   - `JWT_EMAIL_SECRET` - Random string for email tokens
   - Email service credentials (SMTP)

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the server**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` (or your configured PORT).

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register organization + admin
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/verify-email/:token` - Verify email
- `POST /api/v1/auth/request-password-reset` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password
- `POST /api/v1/auth/refresh-token` - Refresh access token

### Users
- `POST /api/v1/users` - Create user (ADMIN only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user (ADMIN only)
- `DELETE /api/v1/users/:id` - Delete user (ADMIN only)

### Clients
- `POST /api/v1/clients` - Create client
- `GET /api/v1/clients` - Get all clients (with search)
- `GET /api/v1/clients/:id` - Get client by ID
- `PUT /api/v1/clients/:id` - Update client
- `DELETE /api/v1/clients/:id` - Delete client (soft delete)

### Measurement Templates
- `POST /api/v1/measurements/templates` - Create template
- `GET /api/v1/measurements/templates` - Get all templates
- `GET /api/v1/measurements/templates/:id` - Get template by ID
- `PUT /api/v1/measurements/templates/:id` - Update template
- `DELETE /api/v1/measurements/templates/:id` - Delete template

### Measurements
- `POST /api/v1/measurements` - Create measurement
- `GET /api/v1/measurements` - Get all measurements
- `GET /api/v1/measurements/client/:clientId` - Get client measurements
- `GET /api/v1/measurements/:id` - Get measurement by ID
- `PUT /api/v1/measurements/:id` - Update measurement
- `DELETE /api/v1/measurements/:id` - Delete measurement

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get all orders (with filters)
- `GET /api/v1/orders/:id` - Get order by ID
- `PUT /api/v1/orders/:id` - Update order
- `PATCH /api/v1/orders/:id/status` - Update order status
- `PATCH /api/v1/orders/:id/payment` - Record payment
- `DELETE /api/v1/orders/:id` - Delete order
- `GET /api/v1/orders/reports/financial` - Financial summary (ADMIN only)

### Organization
- `GET /api/v1/organization` - Get organization details
- `PUT /api/v1/organization` - Update organization (ADMIN only)

## 🔐 Authentication

All protected endpoints require a JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## 👥 User Roles

- **ORG_ADMIN** - Full access to all features including financial reports and user management
- **STAFF** - Can create and manage clients, measurements, and orders (no access to financial reports or user management)

## 📨 Email Configuration

The API uses Nodemailer for sending emails. Configure your SMTP settings in `.env`:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@tailorapp.com
EMAIL_FROM_NAME=Tailor App
```

For Gmail, you'll need to create an [App Password](https://support.google.com/accounts/answer/185833).

## 🧪 Testing with Postman

Import the Postman collection from `postman/Tailor-API.postman_collection.json` to test all API endpoints.

## 🛡️ Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request validation
- Organization-level data isolation

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

ISC

## 🆘 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for tailors and dressmakers**
