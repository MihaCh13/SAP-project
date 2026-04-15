# `src/components/auth`

Minimal **route protection** for authenticated application routes.

---

## Folder purpose

Ensure users without a valid **session** cannot reach `MainLayout` and its children; redirect unauthenticated visitors to **`/login`**.

---

## Key files

| File | Responsibility |
|------|----------------|
| `ProtectedRoute.jsx` | Wrapper component: reads `getSession()` from `../../lib/session.js`. If `session?.userId` is missing, renders `<Navigate to="/login" replace />`. Otherwise renders `children` (typically `MainLayout`). |

---

## Integration points

| Concern | Detail |
|---------|--------|
| **Session source** | `../../lib/session.js` — must stay the single source of truth for “logged in” in the SPA. |
| **Router** | Used in `App.jsx` as the parent element for all routes that need the shell. |
| **Logout** | `clearSession()` in `MainLayout` / modals removes the gate condition on next navigation. |

---

## Extension ideas

- Role-based route matrices (e.g. admin-only) currently live at **page** level (`Navigate` in `UserManagement`, `AuditLogsPage`). Centralizing in `ProtectedRoute` variants would be a future refactor.
