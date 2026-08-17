# Firebase chat setup

The user app, trainer app, and backend must use the same Firebase project.

## Data contract

- Collection: `conversations`
- Conversation id: `player_{playerId}__trainer_{trainerId}`
- Messages: `conversations/{conversationId}/messages`
- `playerId` and `trainerId` are the PostgreSQL user UUIDs.
- The backend provisions conversation documents only for ACTIVE trainer assignments.
- Clients read messages from Firestore in real time. Message writes go through
  `POST /api/chat/messages` so the backend can validate the assignment and
  notify the recipient.

## Required setup

1. Enable Firebase Authentication and Cloud Firestore in the Firebase project.
2. Configure the backend `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and
   `FIREBASE_PRIVATE_KEY` values.
3. Link both Flutter apps to that same Firebase project with FlutterFire CLI.
4. Deploy the rules and indexes from this directory:

   `firebase deploy --only firestore:rules,firestore:indexes`

5. Keep the backend `GET /api/chat/firebase-token` endpoint authenticated. It
   creates a Firebase custom token using the backend user UUID as `uid` and
   includes the USER/TRAINER role claim used by Firestore rules.

The trainer conversation-list index can take a few minutes to finish building
after deployment.

Both Flutter apps must register their FCM device token through
`POST /api/notifications/tokens`. The chat message endpoint stores an inbox
notification and sends an FCM push to every registered device of the recipient.
