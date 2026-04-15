# `src/pages`

**Route-level screens** and **heavy views**. Many `*Page.jsx` files are thin wrappers that default-export a larger component from the same folder (keeps `App.jsx` imports tidy).

---

## Folder purpose

- Map **URL paths** to user-facing features (dashboard, drafts, review, admin).
- Host **page-specific state** and data loading (often `loadMockDrafts`, `getSession`, etc.).
- Enforce **role UX** (e.g. admin-only pages redirect non-admins).

---

## Routing map (`App.jsx`)

| Path | Component file | Notes |
|------|----------------|-------|
| `/login` | `LoginContainer` (in `components/`) | Public. |
| `/dashboard` | `DashboardPage.jsx` → `Dashboard.jsx` | Role-aware bento dashboard; reads mock stores for live stats. |
| `/public-hub` | `PublicHubPage.jsx` → `PublicHub.jsx` | Published-style document list (demo data). |
| `/my-drafts` | `MyDraftsPage.jsx` → `MyDrafts.jsx` | Author’s drafts/rejected; **Submit** calls `mockWorkflowService`. |
| `/new-document` | `NewDocumentPage.jsx` → `NewDocument.jsx` | Rich text editor; saves to `mock_global_documents`. |
| `/pending-review` | `PendingReviewPage.jsx` → `ReviewQueue.jsx` | Reviewer queue (`SUBMITTED` docs). |
| `/users-roles` | `UsersRolesPage.jsx` → `UserManagement.jsx` | Admin user directory + pending approvals. |
| `/audit-logs` | `AuditLogsPage.jsx` | Admin audit explorer (`mock_global_audit_logs`). |
| `/help` | `HelpPage.jsx` | Help / support content. |
| `/profile` | — | Redirects to `/dashboard`. |

Wildcard `*` redirects to `/dashboard` (adjust if you prefer `/login` for unknown paths).

---

## Key files

| File | Responsibility |
|------|----------------|
| `Dashboard.jsx` | Aggregates documents, users, audit snippets for cards; role-sorted layout. |
| `MyDrafts.jsx` | Lists current author’s `DRAFT` / `REJECTED`; submit workflow; listens for document updates. |
| `NewDocument.jsx` | Create/update drafts; versions on document entity; audit on save. |
| `ReviewQueue.jsx` | Approve/reject via `mockWorkflowService`; `SUBMITTED` filter. |
| `UserManagement.jsx` | CRUD-style user patches, deactivate/reactivate, pending approval; audit on actions. |
| `AuditLogsPage.jsx` | Search/filter/paginate audit log entries; export demo CSV. |
| `PublicHub.jsx` | Curated “approved” public documents (can diverge from strict `loadMockDrafts` filter). |
| `HelpPage.jsx` / `HelpCenter.jsx` | Static / structured help content. |
| `SimplePage.jsx`, `ProfilePage.jsx` | Legacy or placeholder screens if still referenced. |

---

## Integration points

| Service / key | Typical consumers |
|---------------|-------------------|
| `loadMockDrafts` / `persistMockDrafts` | `MyDrafts`, `NewDocument`, `ReviewQueue`, `Dashboard` |
| `mockWorkflowService` | `MyDrafts` (submit), `ReviewQueue` (approve/reject) |
| `loadMockUsers` / `persistMockUsers` | `UserManagement`, `SettingsDrawer`, `PasswordModal` |
| `getMockAuditLogs` / `appendMockAuditLog` | `AuditLogsPage`, workflow, user admin, notifications |
| `getSession` | Almost every page for scoping data to the signed-in user |

---

## Conventions

- Prefer **loading from `localStorage` on each interaction** or subscribe to **`window` events** for multi-tab consistency (pattern used for documents and users).
- Keep **admin-only** checks at the top of the page component (`Navigate`) in addition to hiding sidebar links.
