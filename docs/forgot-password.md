# Forgot Password Flow

The forgot password flow allows users to reset their account password if they can no longer access it.

## 1. Request Password Reset
Users initiate the process by providing their email address.

- **Endpoint**: `POST /api/v1/auth/request-password-reset`
- **Access**: Public
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response (Success)**:
  `200 OK`
  ```json
  {
    "success": true,
    "message": "If that email exists, a password reset link has been sent",
    "data": null
  }
  ```
  > [!NOTE]
  > For security, the response is always the same even if the email does not exist in the database.

## 2. Password Reset Email
The system generates a secure token and sends an email to the user.

- **Token Expiration**: 1 hour (configurable via `JWT_EMAIL_EXPIRATION`)
- **Email contains**: A link to the frontend: `${FRONTEND_URL}/reset-password?token=<TOKEN>`
- **Development**: If `RESEND_API_KEY` is not provided in `development` mode, the link is logged to the console instead of being sent.

## 3. Reset Password
Once the user clicks the link, the frontend captures the token and allows the user to set a new password.

- **Endpoint**: `POST /api/v1/auth/reset-password/:token`
- **Access**: Public (Token-based)
- **Body**:
  ```json
  {
    "password": "newPassword123"
  }
  ```
- **Validation**:
  - `password`: Minimum 6 characters.
- **Response (Success)**:
  `200 OK`
  ```json
  {
    "success": true,
    "message": "Password reset successfully",
    "data": null
  }
  ```

## Security Considerations
- **Tokens are JWT-based** and signed with `JWT_EMAIL_SECRET`.
- **Encryption**: Passwords are hashed using `bcryptjs` before being saved to the database.
- **No data leakage**: The request endpoint does not reveal whether an email exists in the system.
