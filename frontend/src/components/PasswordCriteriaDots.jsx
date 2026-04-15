import { getPasswordCriteria } from '../utils/passwordValidation'

const LABELS = [
  { key: 'minLength', label: '6+ characters' },
  { key: 'upper', label: 'Uppercase' },
  { key: 'lower', label: 'Lowercase' },
  { key: 'number', label: 'Number' },
  { key: 'special', label: 'Special (!@#$%^&*)' },
]

export default function PasswordCriteriaDots({ password, idPrefix = 'pwd' }) {
  const c = getPasswordCriteria(password)

  return (
    <ul
      className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-xs"
      aria-live="polite"
    >
      {LABELS.map(({ key, label }) => {
        const ok = c[key]
        return (
          <li key={key} className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full transition-colors ${
                ok ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
              aria-hidden
            />
            <span
              id={`${idPrefix}-crit-${key}`}
              className={ok ? 'text-emerald-700' : 'text-slate-500'}
            >
              {label}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
