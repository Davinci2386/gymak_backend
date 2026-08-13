# Notification inbox API

Every direct or broadcast notification sent by the admin is now stored for each targeted active account before the FCM delivery attempt. This allows users and trainers to see their notification history even when they have no registered device token or FCM delivery fails.

All inbox endpoints require:

```http
Authorization: Bearer <accessToken>
```

## List current account notifications

```http
GET /api/notifications?page=1&limit=20&unreadOnly=false
```

- `page`: defaults to `1`.
- `limit`: defaults to `10`, maximum `100`.
- `unreadOnly`: use `true` or `1` to return unread notifications only.

Success response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notification-uuid",
        "title": "Subscription activated",
        "body": "Your subscription is now active.",
        "data": {
          "type": "subscription",
          "subscriptionId": "subscription-uuid"
        },
        "isRead": false,
        "readAt": null,
        "createdAt": "2026-08-13T12:00:00.000Z"
      }
    ],
    "unreadCount": 1
  },
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

## Get unread count

```http
GET /api/notifications/unread-count
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Unread notifications count retrieved successfully",
  "data": {
    "unreadCount": 3
  }
}
```

## Mark one notification as read

```http
PATCH /api/notifications/:notificationId/read
```

The notification must belong to the authenticated account. Otherwise the API returns `404`.

## Mark all notifications as read

```http
PATCH /api/notifications/read-all
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 3
  }
}
```

## Deployment

After deploying the updated source code, rebuild the app image and apply the migration:

```bash
docker compose up -d --build
docker compose exec app npx prisma migrate deploy
docker compose restart app
```

Verify the migration and service:

```bash
docker compose exec app npx prisma migrate status
docker compose logs --tail 100 app
```
