# `src/lib`

**Mock backend**, **session**, **workflow**, **notifications**, and **layout helpers**. This folder is the **data and rules layer** for the entire SPA; UI components should call into `lib` rather than duplicating `localStorage` access patterns.

---

## Folder purpose

| Concern | Files |
|---------|--------|
| **Persistence keys** | `mockUsers.js`, `mockDrafts.js`, `mockAuditLogs.js` export `MOCK_GLOBAL_*_KEY` constants. |
| **Entities** | JSDoc-modeled shapes aligned with Java-style entities (users, documents + versions, audit rows, notifications). |
| **Workflow** | `mockWorkflowService.js` — submit, approve, reject + audit + reviewer/author notifications. |
| **Auth session** | `session.js` — mock password overrides, session blob, welcome flags. |
| **Responsive hook** | `useLayoutBreakpoint.js` — `mobile` / `tablet` / `desktop`. |

---

## Key files

| File | Responsibility |
|------|----------------|
| `mockUsers.js` | `loadMockUsers`, `persistMockUsers`, `getDefaultMockUsers`, `findMockUserByUsername`, `normalizeRolesForDisplay`, avatar helper. Key: **`MOCK_GLOBAL_USERS_KEY`**. |
| `mockDrafts.js` | `loadMockDrafts`, `persistMockDrafts`, `getDefaultMockDrafts`, `migrateDocument`, `applyActiveVersionFields`, `documentAuthorId` / `documentAuthorDisplay`, snippet builder. Key: **`MOCK_GLOBAL_DOCUMENTS_KEY`**. |
| `mockAuditLogs.js` | `loadMockAuditLogs`, `persistMockAuditLogs`, `appendMockAuditLog`, default seed. Key: **`MOCK_GLOBAL_AUDIT_LOGS_KEY`**. |
| `mockWorkflowService.js` | `submitDocumentForReview`, `approveDocument`, `rejectDocument` — permissions, status transitions, audit, **notification fan-out**. |
| `mockUserNotifications.js` | Normalize/push/mark-read notifications on user records; audit on read. |
| `session.js` | `getSession`, `persistSession`, `clearSession`, mock password keys, `buildSessionFromUsername`. |
| `notifications.js` | Thin async helper delegating unread count to `mockUserNotifications` (legacy compatibility). |
| `useLayoutBreakpoint.js` | Single source of breakpoint tier for layout shell. |

---

## `localStorage` keys (reference)

| Key | Owner module |
|-----|----------------|
| `mock_global_users` | `mockUsers.js` |
| `mock_global_documents` | `mockDrafts.js` |
| `mock_global_audit_logs` | `mockAuditLogs.js` |
| `sap_dm_session` | `session.js` |
| `mock_password_*`, `mock_password_change_complete_*` | `session.js` (per-username demo passwords) |

---

## Integration points

| Pattern | Description |
|---------|-------------|
| **Write path** | Mutate in-memory array → `persistMock*` → optional `window.dispatchEvent` for UI refresh. |
| **Read path** | `loadMock*` returns parsed JSON; seeds defaults if key missing or corrupt. |
| **Cross-tab** | Same keys; events reduce need for manual polling in simple cases. |

---

## Status vocabulary (documents)

`DRAFT` → `SUBMITTED` (review queue) → `APPROVED` | `REJECTED`. Legacy `PENDING_REVIEW` in old data is migrated to **`SUBMITTED`** in `mockDrafts.js`.

---

## Testing tips

- Clear the four global keys above to reset to **bundled Bulgarian demo seed**.
- Use two browsers or profiles to simulate **author vs reviewer** concurrently.
