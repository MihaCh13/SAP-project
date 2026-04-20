# `src/components/layout`

The **application shell**: sticky header, responsive sidebar, welcome overlay, settings drawer, and **in-app notifications**. This folder is the primary place where **adaptive layout** and **mirror width** (`max-w-7xl`) are applied together with `MainLayout.jsx`.

---

## Folder purpose

- Compose **chrome** around `react-router`’s `<Outlet />`.
- Expose **`LayoutContext`** for sidebar collapse + breakpoint-driven **mobile drawer** state.
- Host **NotificationBell** (reads `mock_global_users` → current user’s `notifications`).

---

## Key files

| File | Responsibility |
|------|----------------|
| `MainLayout.jsx` | Root shell: welcome phase, header, flex row with sidebar + `main`, `max-w-7xl` content wrapper, settings + logout modals. Owns **mobile drawer open** state and backdrop. |
| `LayoutContext.jsx` | `useAppLayout()` → `{ sidebarCollapsed, setSidebarCollapsed, layoutBreakpoint, mobileNavOpen, setMobileNavOpen, closeMobileNav }`. **Note:** `sidebarCollapsed` is the **effective** value (tablet forces icon-only). |
| `AppHeader.jsx` | Branding row: optional **burger** (mobile), user name + role chips, search (`md+`), **NotificationBell**, avatar, settings shortcut. Uses `max-w-7xl mx-auto` for alignment with main. |
| `AppSidebar.jsx` | Nav links by role; **fixed drawer** + close row on mobile; **icon rail** on tablet; collapsible on desktop; `onAfterNavigate` closes mobile drawer. |
| `NotificationBell.jsx` | Popover UI; unread badge + pulse; **Mark as read** → `markNotificationAsRead` in `lib/mockUserNotifications.js`. |
| `SettingsDrawer.jsx` | Profile photo, password entry point, logout trigger; listens for user updates. |
| `WelcomeSequence.jsx` | Post-login welcome animation; coordinated with `session` welcome flag. |

---

## Integration points

| System | Files / APIs |
|--------|----------------|
| **Breakpoints** | `../../lib/useLayoutBreakpoint.js` consumed by `MainLayout.jsx`. |
| **Session** | `../../lib/session.js` — `getSession` in header/sidebar. |
| **Avatars** | `../../lib/mockUsers.js` — `getMockUserAvatarDataUrl`. |
| **Notifications** | `../../lib/mockUserNotifications.js` + `mockUsers` persistence. |
| **Events** | `sap_dm_mock_users_updated`, `sap_dm_mock_documents_updated` (sidebar/header consumers). |

---

## Responsive rules (summary)

| Breakpoint | Sidebar | Header |
|------------|---------|--------|
| `< 768px` | Off-canvas + burger | Burger toggles `mobileNavOpen` |
| `768–1023px` | Always `w-[4.5rem]`, labels hidden | No burger |
| `≥ 1024px` | `w-60` or collapsed rail | No burger |

See `../../../UX_GUIDELINES.md` for full UX notes.
