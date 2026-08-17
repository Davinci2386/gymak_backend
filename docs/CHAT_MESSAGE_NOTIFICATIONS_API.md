# Chat messages and push notifications

## Send a text message

```http
POST /api/chat/messages
Authorization: Bearer <access-token>
Content-Type: application/json
```

Player request:

```json
{
  "playerId": "player-user-uuid",
  "text": "Hello coach",
  "clientMessageId": "firestore-generated-message-id"
}
```

Trainer request uses the same shape. `playerId` selects one of the trainer's
actively assigned players. For a player, the value must be their own user id.

`clientMessageId` is optional, but both Flutter apps send it. Repeating the
same request with the same id returns the existing message and does not create
another inbox notification or FCM push.

Created response:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Message sent successfully",
  "data": {
    "created": true,
    "message": {
      "id": "firestore-generated-message-id",
      "conversationId": "player_player-user-uuid__trainer_trainer-user-uuid",
      "senderId": "player-user-uuid",
      "receiverId": "trainer-user-uuid",
      "text": "Hello coach",
      "type": "text",
      "sentAt": "2026-08-16T12:00:00.000Z"
    },
    "notification": {
      "status": "SENT",
      "sentCount": 1,
      "failedCount": 0,
      "inboxNotificationId": "notification-uuid"
    }
  }
}
```

The message is successful even when the recipient has no device token. In that
case it remains in Firestore and in the recipient's notification inbox, while
`notification.status` is `FAILED` with `sentCount: 0`.

## Required deployment

From the backend directory:

```powershell
docker compose up -d --build
firebase deploy --only firestore:rules,firestore:indexes --project workoutapp-148ba
```

Both apps must be rebuilt because sending now uses the backend endpoint. Each
app registers its FCM token after login and again when Firebase refreshes it.
