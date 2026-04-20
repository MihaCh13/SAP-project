# `src/components`

Reusable **UI**, **auth entry**, and **application chrome** (layout, modals, marketing-style visuals). Route-level screens live in `../pages`; cross-cutting **mock business logic** lives in `../lib`.

---

## Folder purpose

| Subfolder / area | Responsibility |
|------------------|----------------|
| **`layout/`** | Header, sidebar, main shell, settings drawer, welcome sequence, **notification bell**. |
| **`auth/`** | **`ProtectedRoute`** — session gate for all post-login routes. |
| **Root `components/`** | Login/account flows, password flows, document drawers, shared icons, logout confirm. |

---

## Key files (root)

| File | Responsibility |
|------|----------------|
| `LoginContainer.jsx` | Orchestrates login vs account request vs forced password change; validates users via `findMockUserByUsername`; navigates to dashboard. |
| `LoginView.jsx` | Sign-in form UI (centered mirror layout). |
| `AccountRequestView.jsx` | Account request form (centered); demo validation only. |
| `PasswordChangeModal.jsx` | First-login password change gate. |
| `PasswordModal.jsx` | Settings-driven password update; persists to `mock_global_users` + session helpers. |
| `PasswordCriteriaDots.jsx` | Visual password rule hints. |
| `LogoutConfirmModal.jsx` | Confirms logout before `clearSession` + redirect. |
| `DocumentDrawer.jsx` | Slide-over document preview pattern (where used). |
| `DraftFeedbackDrawer.jsx` | Presents reviewer rejection feedback on **My Drafts**. |
| `NodeLinkMesh.jsx` | Decorative SVG mesh for login / marketing panels. |
| `EyeIcon.jsx` | Reusable password visibility icon. |

---

## Integration points

| Integration | How |
|-------------|-----|
| **Session** | `getSession`, `persistSession`, `clearSession` from `../lib/session.js`. |
| **Users** | `loadMockUsers`, `findMockUserByUsername`, `persistMockUsers` from `../lib/mockUsers.js`. |
| **Layout state** | `useAppLayout()` from `layout/LayoutContext.jsx` (only under `MainLayout`). |
| **Events** | `window` custom events e.g. `sap_dm_mock_users_updated` to refresh avatars and notification counts. |

---

## Related documentation

- **`layout/README.md`** — shell components in detail.
- **`auth/README.md`** — route protection.
- **`../pages/README.md`** — what renders inside `MainLayout`’s `Outlet`.
