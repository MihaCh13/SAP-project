# SAP-Style Document Management — Frontend

This package is a **single-page application (SPA)** that simulates an enterprise document lifecycle: drafting, submission, reviewer queue, approval/rejection, admin user management, and audit visibility. It is designed to mirror SAP Fiori–adjacent UX patterns while using a **browser-only mock backend** (`localStorage`) so the UI can run without a Java server.

---

## Project overview

| Area | Description |
|------|-------------|
| **Purpose** | Governed document workflows: authors maintain drafts, submit for review, reviewers act on a shared queue, admins manage users and inspect audit trails. |
| **Auth model** | Session stored in `localStorage` (`sap_dm_session`); credentials validated against the mock user directory. |
| **Data** | Documents, users, audit logs, and per-user notifications are persisted under **`mock_global_*`** keys (see [Data layer](#data-layer)). |
| **Out of scope** | This folder does not ship the Spring Boot backend; integration points are conceptual (entity shapes mirrored in mocks). |

---

## Tech stack

| Layer | Technology | Notes |
|-------|------------|--------|
| **UI** | [React 19](https://react.dev/) | Function components, hooks. |
| **Routing** | [React Router 7](https://reactrouter.com/) | `BrowserRouter`, nested routes, `ProtectedRoute` guard. |
| **Build** | [Vite 8](https://vitejs.dev/) | ESM, fast HMR, `vite.config.js`. |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first; `@tailwindcss/postcss` in dev pipeline. |
| **Motion** | [Framer Motion](https://www.framer.com/motion/) | Page transitions, drawers, modals. |
| **Lint** | ESLint 9 + `eslint-plugin-react-hooks` | `npm run lint`. |
| **Icons** | **Inline SVG** in JSX | No icon font package; components embed `svg` paths for crisp scaling. |
| **Language** | JavaScript (ES modules) | JSDoc typedefs in `lib/` for mock entities. |

There are **no** `hooks/`, `context/` (beyond layout), or `services/` top-level folders under `src/` today; shared logic lives in **`src/lib`**.

---

## Architecture

### Application shell

1. **`App.jsx`** defines routes: public `/login`, then a **`ProtectedRoute`** wrapper around **`MainLayout`** for all app pages.
2. **`MainLayout`** composes **`AppHeader`**, **`AppSidebar`**, and an **`Outlet`** for page content. **`LayoutContext`** supplies sidebar collapse state and breakpoint-driven mobile drawer state.

### Adaptive design (“mirror layout”)

The layout is **fluid** and **breakpoint-aware** so chrome and content align predictably:

| Viewport | Width (approx.) | Sidebar | Header |
|----------|-----------------|---------|--------|
| **Mobile** | &lt; 768px | Hidden off-canvas; **burger** toggles drawer | Full width; compact actions |
| **Tablet** | 768px – 1023px | **Icon-only** rail (fixed narrow width) | Search visible from `md` |
| **Desktop** | ≥ 1024px | Full labels + user-controlled **collapse** | Same |

**Mirror / containment:** main content is wrapped in **`max-w-7xl mx-auto`** so ultra-wide monitors do not stretch reading width; the header uses the same horizontal cap for visual alignment. Typography and spacing favor **rem-based** Tailwind arbitrary values where precision matters (see `UX_GUIDELINES.md`).

### Module map

| Path | Role |
|------|------|
| `src/pages/*` | Route-level screens (often thin wrappers around larger views). |
| `src/components/*` | Reusable UI, auth shell, layout chrome, modals. |
| `src/lib/*` | Mock persistence, workflow, session, notifications, breakpoints. |
| `src/utils/*` | Shared validation helpers (e.g. password rules). |
| `src/assets/*` | Static assets (Vite template SVGs). |

Each major folder under `src/` includes its own **`README.md`** with file-level notes.

---

## Data layer (mock backend)

All collaborative state is stored in **`localStorage`** so multiple tabs share the same mock “database.”

| Key | Purpose |
|-----|---------|
| `mock_global_users` | User directory: credentials, roles, `notifications[]`, avatar, flags. |
| `mock_global_documents` | Global document list (drafts, submitted, approved, rejected). |
| `mock_global_audit_logs` | Append-only style audit entries for admin UI and compliance demo. |
| `sap_dm_session` | Current signed-in user snapshot (`userId`, `displayName`, `roles`, …). |

Supporting keys (demo only): `mock_password_*`, `sap_dm_show_welcome`, etc. — see `src/lib/session.js`.

### Workflow & notifications

- **`mockWorkflowService.js`** — submit / approve / reject with permission checks and audit append.
- **`mockUserNotifications.js`** — pushes in-app notifications onto reviewer/author user records; **mark as read** persists and writes an audit row.

Events such as `sap_dm_mock_users_updated` and `sap_dm_mock_documents_updated` allow the UI to refresh without a full page reload.

Entity shapes intentionally mirror backend concepts (users, documents with versions, audit logs). See folder READMEs under `src/lib` for field-level detail.

---

## Getting started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+

### Install

```bash
cd frontend
npm install
```

### Development server

```bash
npm run dev
```

Default Vite URL: **http://localhost:5173/** (if the port is busy, Vite picks the next free port).

### Production build

```bash
npm run build
```

Output: `frontend/dist/`. Preview locally:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

---

## Documentation index

| Document | Contents |
|----------|----------|
| **`README.md`** (this file) | Project overview, stack, architecture, data layer, commands. |
| **`UX_GUIDELINES.md`** | Responsiveness, visual language, logout guard, notifications. |
| **`src/README.md`** | Quick map of `src/` and links to folder READMEs. |
| **`src/components/README.md`** | UI components and layout overview. |
| **`src/components/layout/README.md`** | Shell: header, sidebar, drawers, notifications bell. |
| **`src/components/auth/README.md`** | Route protection. |
| **`src/pages/README.md`** | Routes and major screens. |
| **`src/lib/README.md`** | Mock services, keys, workflow. |
| **`src/utils/README.md`** | Validation helpers. |
| **`src/assets/README.md`** | Static assets. |

---

## Demo credentials

Seeded users (password **`SapDemo1!`** unless changed in-app) are documented in `src/lib/mockUsers.js` — e.g. `adm_elena`, `auth_ivan`, `rev_nikolay`. Clear `localStorage` keys listed above to reset to bundled seed data.

---

## License

Private project (`"private": true` in `package.json`). Adjust as needed for your organization.
