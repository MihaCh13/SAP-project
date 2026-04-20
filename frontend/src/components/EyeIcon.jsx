/** Password visibility toggle — matches LoginView artwork. */
export default function EyeIcon({ open, className = 'h-5 w-5' }) {
  if (open) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden>
        <path
          stroke="currentColor"
          strokeWidth={1.5}
          d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"
        />
        <circle cx="12" cy="12" r="2.25" stroke="currentColor" strokeWidth={1.5} />
      </svg>
    )
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" aria-hidden>
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.5}
        d="M3 3l18 18M10.5 10.5a3 3 0 004.243 4.243M9.88 5.09A10.14 10.14 0 0112 4.75c5.25 0 9.75 6.75 9.75 6.75s-.98 1.76-2.7 3.47M6.36 6.36C4.17 8.11 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.33 0 2.57-.36 3.69-.94"
      />
    </svg>
  )
}
