# Admin transactions API

## Endpoint

```http
GET /api/admin/transactions
```

Authentication is required and the authenticated account must have the `ADMIN` role.

```http
Authorization: Bearer <adminAccessToken>
```

## Query parameters

| Parameter | Description |
|---|---|
| `page` | Page number. Defaults to `1`. |
| `limit` | Items per page. Defaults to `20`, maximum `100`. |
| `status` | `PENDING`, `COMPLETED`, `FAILED`, or `REFUNDED`. |
| `userId` | Filter by user UUID. |
| `planId` | Filter by subscription plan UUID. |
| `search` | Searches user name, email, Stripe Payment Intent ID, and Stripe Charge ID. |
| `dateFrom` | Inclusive payment creation date in ISO 8601 format. |
| `dateTo` | Inclusive payment creation date in ISO 8601 format. |
| `sortOrder` | `desc` by default, or `asc`. |

Example:

```http
GET /api/admin/transactions?page=1&limit=20&status=COMPLETED&search=user@example.com&dateFrom=2026-08-01T00:00:00.000Z&dateTo=2026-08-31T23:59:59.999Z&sortOrder=desc
```

## Success response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "id": "payment-uuid",
        "status": "COMPLETED",
        "amount": 2999,
        "amountFormatted": "USD 29.99",
        "currency": "USD",
        "stripePaymentIntentId": "pi_xxxxxxxxx",
        "stripeChargeId": "ch_xxxxxxxxx",
        "errorMessage": null,
        "user": {
          "id": "user-uuid",
          "firstName": "Test",
          "lastName": "User",
          "email": "user@example.com",
          "accountStatus": "ACTIVE",
          "fullName": "Test User"
        },
        "plan": {
          "id": "plan-uuid",
          "name": "Gold Plan",
          "price": 2999,
          "durationDays": 30
        },
        "subscription": {
          "id": "subscription-uuid",
          "status": "ACTIVE",
          "startDate": "2026-08-14T10:00:00.000Z",
          "endDate": "2026-09-13T10:00:00.000Z",
          "cancelledAt": null
        },
        "createdAt": "2026-08-14T10:00:00.000Z",
        "updatedAt": "2026-08-14T10:01:00.000Z"
      }
    ]
  },
  "pagination": {
    "currentPage": 1,
    "perPage": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

`amount` and `plan.price` are returned in cents. `amountFormatted` is provided for display.
