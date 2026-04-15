# `src` — Source overview

Entry: **`main.jsx`** mounts **`App.jsx`** into `#root` and imports global styles from **`index.css`**.

---

## Directory map

| Directory | README | Role |
|-----------|--------|------|
| **`components/`** | [components/README.md](./components/README.md) | UI, layout shell, auth gate, modals. |
| **`pages/`** | [pages/README.md](./pages/README.md) | Routed screens and large views. |
| **`lib/`** | [lib/README.md](./lib/README.md) | Mock persistence, workflow, session, notifications. |
| **`utils/`** | [utils/README.md](./utils/README.md) | Shared validation helpers. |
| **`assets/`** | [assets/README.md](./assets/README.md) | Static imports (template SVGs). |

There is **no** top-level `hooks/`, `services/`, or dedicated `context/` folder—React context for layout lives under **`components/layout/LayoutContext.jsx`**.

---

## Bootstrap files

| File | Role |
|------|------|
| `main.jsx` | `createRoot`, StrictMode (if enabled), CSS import. |
| `App.jsx` | `BrowserRouter`, route table, `ProtectedRoute` + `MainLayout` composition. |
| `index.css` | Tailwind / global base styles. |

---

## Upstream documentation

Project-level docs live in the **`frontend/`** root:

- [`../README.md`](../README.md) — install, architecture, data keys.
- [`../UX_GUIDELINES.md`](../UX_GUIDELINES.md) — responsive and interaction standards.
