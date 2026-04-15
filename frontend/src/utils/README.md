# `src/utils`

Small **pure helpers** shared across components—mainly **validation** and formatting rules that should stay decoupled from React.

---

## Folder purpose

Keep **business-ish rules** (email format, password complexity) in one place so login, account request, and password modals stay consistent.

---

## Key files

| File | Responsibility |
|------|----------------|
| `passwordValidation.js` | Exports `SAP_EMAIL_REGEX`, `isPasswordPolicyMet`, and related checks used by `AccountRequestView`, `PasswordChangeModal`, `PasswordModal`, etc. |

---

## Integration points

| Consumer | Usage |
|----------|--------|
| `components/AccountRequestView.jsx` | Corporate email validation. |
| `components/PasswordChangeModal.jsx` / `PasswordModal.jsx` | Password policy parity with first-login flow. |

---

## Guidelines

- Add new helpers here when **two or more** call sites need the same logic.
- Avoid importing `lib/session` or `lib/mock*` from utils—keep this folder **framework-agnostic** where possible.
