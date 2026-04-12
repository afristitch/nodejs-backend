# Frontend Integration Guide: Account Deletion

To comply with Apple App Store requirements (**Guideline 5.1.1(v)**), the app must offer a functional way for users to delete their accounts. This guide explains how to integrate the account deletion feature.

## 1. Deletion Endpoint

**Endpoint:** `DELETE /api/v1/profile/me`

**Authentication:** Required (Bearer Token)

**Description:** This endpoint will delete the authenticated user's account and all associated data according to their role.

### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully",
  "data": null
}
```

**Error (401 Unauthorized / 403 Forbidden):**
- If the token is invalid or missing.

## 2. Practical Implementation

### Warning and Confirmation
Account deletion is **permanent** and **immediate**. It is highly recommended to display a prominent confirmation dialog before making the request.

> [!WARNING]
> If the user is an **Organization Admin**, this action will delete the **entire organization** and all its data (clients, orders, measurements, etc.). Staff members' accounts will also be deleted.

### Recommended UX Flow
1. User navigates to **Profile** or **Settings**.
2. User taps **Delete Account**.
3. App displays a modal:
   - **Title**: "Delete Account?"
   - **Message**: "This action is permanent and cannot be undone. All your data, including clients, orders, and measurements, will be deleted."
   - **Buttons**: [Cancel] [Delete (Red Style)]
4. On "Delete" click, the app calls `DELETE /api/v1/profile/me`.
5. On success:
   - Clear all local storage (JWT, tokens, etc.).
   - Navigate the user to the Login/Welcome screen.

## 3. Post-Deletion Behavior
Once the request is successful, the user's session is invalidated on the server. Any subsequent requests with the old JWT will return a `401 Unauthorized` error.
