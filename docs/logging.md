# Logging and System Administration

The Tailor API implements a robust logging system using [Winston](https://github.com/winstonjs/winston) for structured logging, file rotation, and secure administrative access.

## Architecture

### 1. Logger Utility (`src/utils/logger.ts`)
The core logger is configured with three main transports:
- **Console**: Used in development (`NODE_ENV=development`) with colorized, human-readable output.
- **Combined File**: Rotates daily, stored in `logs/combined-%DATE%.log`. Contains `info` level logs and above. Retained for 14 days.
- **Error File**: Rotates daily, stored in `logs/error-%DATE%.log`. Only contains `error` level logs. Retained for 30 days.

### 2. Request Logging Middleware (`src/middlewares/logging.middleware.ts`)
A global middleware that logs details for every incoming request:
- HTTP Method and URL
- IP Address and User Agent
- Status Code
- Response Duration (ms)
- User ID (if authenticated)

### 3. Error Handling (`src/middlewares/error.middleware.ts`)
The global error handler automatically logs all caught exceptions with their full stack traces and correlated request context.

## Roles and Security

To protect sensitive system logs, a tiered administrative structure is implemented:

| Role | Description | System Logs Access |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform Owners / DevOps | **Yes** |
| `ORG_ADMIN` | Tailor Business Owners | **No** |
| `STAFF` | Tailor Business Employees | **No** |

Access to system routes (`/api/v1/system/*`) is strictly restricted to the `SUPER_ADMIN` role using the `requireSuperAdmin` middleware.

## Admin API Endpoints

### List Log Files
Lists available log files with size and timestamp metadata.
- **Route**: `GET /api/v1/system/logs`
- **Access**: `SUPER_ADMIN`

### View Log Content
Streams the content of a specific log file.
- **Route**: `GET /api/v1/system/logs/:filename`
- **Access**: `SUPER_ADMIN`
- **Security**: Implements protection against directory traversal.

## Log Format
Logs are saved in JSON format for easy parsing and ingestion by log management tools.

Example:
```json
{
  "level": "info",
  "message": "GET /api/v1/clients 200 45ms",
  "method": "GET",
  "url": "/api/v1/clients",
  "status": 200,
  "duration": "45ms",
  "userId": "uuid-123",
  "timestamp": "2026-03-07 13:45:01"
}
```
