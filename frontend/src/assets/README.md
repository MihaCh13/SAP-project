# `src/assets`

Static files **imported** by the application (as opposed to URLs in `public/`).

---

## Folder purpose

Holds default Vite/React template assets and any future images, fonts, or SVG sprites referenced from components.

---

## Key files

| File | Responsibility |
|------|----------------|
| `vite.svg` | Vite logo (template artifact; may be unused in production UI). |
| `react.svg` | React logo (template artifact; may be unused). |

---

## Integration points

- Import with Vite’s asset handling, e.g. `import logo from '../assets/vite.svg'` when needed.
- Prefer **inline SVG** in JSX for icons in this project (see root `README.md` tech stack).

---

## When to add assets here

| Use `src/assets` | Use `public/` |
|------------------|---------------|
| Bundled, hashed filenames, tree-shaking | Fixed URL path (e.g. `favicon.ico`, `robots.txt`) |
