# UX & UI Guidelines — Frontend

This document captures **design rules** and **interaction patterns** implemented in this SPA. It complements `README.md` (architecture) and the per-folder `README.md` files under `src/`.

---

## 1. Adaptive grid & breakpoints

Breakpoints follow **Tailwind’s default scale** (see `useLayoutBreakpoint.js`):

| Tier | CSS range | Layout behavior |
|------|-----------|-----------------|
| **Mobile** | `max-width: 767px` | Sidebar **off-canvas**; **hamburger** in `AppHeader` opens a drawer. Backdrop tap closes drawer. Nav links call **`closeMobileNav`** after navigation. |
| **Tablet** | `768px` – `1023px` | Sidebar **always icon-only** (`w-[4.5rem]`); collapse toggle **hidden** (no expand-to-labels on this tier). |
| **Desktop** | `min-width: 1024px` | Sidebar **full width** or **user-collapsed** rail; bottom **Collapse** control toggles. |

### Content width (“mirror”)

- **Header** inner row: `max-w-7xl mx-auto` + horizontal padding in **rem**.
- **Main** column: outer scroll area + inner **`max-w-7xl mx-auto`** so page content and header share the same optical center line on ultrawide displays.

### Typography & density

- Prefer **rem-scaled** utilities: e.g. `text-[0.875rem]`, `p-[1rem]`, `gap-[0.75rem]` where explicit scale is needed.
- Default Tailwind steps (`text-sm`, `text-base`) are acceptable; they compile to **rem** and respect browser zoom.

---

## 2. Styling language

### Palette (SAP-adjacent, not official SAP)

| Token usage | Example |
|-------------|---------|
| **Primary blue** | `#0056b3`, `#003d7a` — buttons, focus rings, active nav. |
| **Surfaces** | `#F7F9FC`, `#eef2f8` — app background, sidebar wash. |
| **Cards** | White + `border-slate-100` + soft shadow utilities. |
| **Status** | Green (success/draft CTA), purple (review), rose/red (danger/reject). |

### Glassmorphism (light touch)

- **Header:** `bg-white/90 backdrop-blur-md` for a frosted bar over scrolling content.
- **Notification popover:** `bg-white/95 backdrop-blur-md` + deep shadow, **no heavy border** (“borderless” panel).

### Density

- Controls use **comfortable** padding (`py-2.5`, `rounded-xl`) suitable for mouse and touch.
- Tables and audit views use **compact** text (`text-sm`, `text-xs`) with clear hierarchy via weight and uppercase section labels.

---

## 3. Interactions

### Logout guard flow

1. User opens **Settings** from the header **gear** (or sidebar **Settings**).
2. **Logout** opens **`LogoutConfirmModal`** — explicit confirm/cancel (prevents accidental sign-out).
3. On confirm: **`clearSession()`**, optional `sessionStorage` clear, hard navigation to **`/login`** (`window.location.href`) so all in-memory state resets cleanly.

Settings drawer listens for **Escape** unless a nested modal (password / logout) is open — avoids trapping the user.

### Notification system logic

| Step | Behavior |
|------|----------|
| **Source** | Notifications live on each **`MockUser.notifications`** entry in `mock_global_users`. |
| **Unread** | Any item with **`isRead: false`** counts toward the bell **badge** and **`animate-pulse`** on the bell control. |
| **Popover** | Bell toggles a **dropdown** listing message, formatted timestamp, and **“✓ Mark as read”** per row. |
| **Persist** | Marking read updates `localStorage` via **`persistMockUsers`**; **`sap_dm_mock_users_updated`** refreshes dependents. |
| **Audit** | Each mark-read appends **`mock_global_audit_logs`** with action *“Marked notification as read”* and `details.notificationId`. |
| **Workflow fan-out** | Submit → reviewers with `REVIEWER` role receive a notification; approve/reject → document **author** receives a notification (see `mockWorkflowService.js` + `mockUserNotifications.js`). |

Click-outside (**`mousedown`** on `document`) closes the popover without marking items read.

---

## 4. Motion (Framer Motion)

- **Route-level:** `LoginContainer` / `AccountRequestView` use enter/exit for polish.
- **Layout:** `MainLayout` fades from welcome sequence to main shell.
- **Drawers / modals:** slide + backdrop; keep durations ~0.22–0.45s and easing `[0.22, 1, 0.36, 1]` for consistency.

Avoid motion that blocks critical actions; respect `prefers-reduced-motion` in future iterations if required by policy.

---

## 5. Accessibility checklist (current baseline)

- Icon-only sidebar: **`title`** + **`aria-label`** on controls.
- Mobile menu: **`aria-expanded`** on burger; drawer close control labeled.
- Forms: **`label`** / **`sr-only`** associations; `aria-invalid` on login errors.
- Notification bell: **`aria-haspopup`**, **`aria-expanded`** when popover open.

---

## 6. File references

| Topic | Primary files |
|-------|----------------|
| Breakpoints | `src/lib/useLayoutBreakpoint.js`, `src/components/layout/MainLayout.jsx` |
| Shell & drawer | `src/components/layout/AppSidebar.jsx`, `AppHeader.jsx` |
| Notifications UI | `src/components/layout/NotificationBell.jsx` |
| Notification data | `src/lib/mockUserNotifications.js` |
| Logout | `src/components/LogoutConfirmModal.jsx`, `MainLayout.jsx` |

For prop-level and API-level detail, see the **`README.md`** in each `src/` subfolder.
