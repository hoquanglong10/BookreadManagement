# Sprint 5 API reference

All reporting routes require a JWT with the `Admin` role. Offline progress sync requires any authenticated member JWT and only writes events for the identity in that token.

## Reporting date window

The reporting routes accept optional UTC `from` and exclusive `to` timestamps. The default is the latest 30 days. A window may span at most 366 days.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/admin/analytics/activity?from=...&to=...` | New member accounts, successful plan purchases, first plan purchases vs renewals, story purchases, active subscriptions at the end of the window, transaction states, and daily account/transaction counts. |
| GET | `/api/admin/analytics/revenue?from=...&to=...&groupBy=day` | Successful revenue over time, by plan, and top 10 purchased stories by revenue. `groupBy` accepts `day` or `month`. |
| GET | `/api/admin/analytics/content?from=...&to=...` | Top read, followed, and purchased stories, plus followed genres. |

Revenue includes `PaymentTransactions` with status `Success`; failed and pending attempts are excluded. The model stores first subscription purchases and renewals as `Type = Plan`, so the report calls a plan transaction a renewal when the same member has an earlier successful transaction for that same plan. Follow and genre-interest metrics use follow rows still present in the reader's library; the schema does not keep a history of unfollow actions. Purchase rankings use successful story transactions.

## Offline reading progress sync

`POST /api/reading-progress/sync` accepts up to 100 events. Each event ID is generated once on the device and retained until the server acknowledges it. The server filters invalid or unpublished episodes and deduplicates retries by member and `clientEventId`.

```json
{
  "events": [
    {
      "clientEventId": "9d7450ac-d9bd-46ad-9f9c-fd20e99c7a31",
      "storyId": 12,
      "chapterNumber": 19,
      "viewedAt": "2026-11-09T10:15:30Z"
    }
  ]
}
```

The response contains `syncedEventIds`, `rejected` items with their reason, and accepted/rejected counts. Episodes cached on Android are scoped to the signed-in account. The app retains at most the latest 100 cached episodes. A server-side migration adds the nullable client event ID and its unique index:

```powershell
cd Backend
dotnet ef database update
```

## Integration check

With the API and development database running, set `BOOKREAD_TEST_ADMIN_USER` and `BOOKREAD_TEST_ADMIN_PASSWORD` in the current PowerShell session and run:

```powershell
./Docs/tests/Sprint5-ApiIntegration.Tests.ps1
```

The script performs read-only reporting checks and sends a deliberately invalid sync event to verify server validation without creating a read record.
