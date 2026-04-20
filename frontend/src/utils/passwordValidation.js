/** SAP corporate email — must end with @sap.com (lowercase domain). */
export const SAP_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@sap\.com$/

export const PASSWORD_SPECIAL_CLASS = /[!@#$%^&*]/

export function getPasswordCriteria(password) {
  const p = password ?? ''
  return {
    minLength: p.length >= 6,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: PASSWORD_SPECIAL_CLASS.test(p),
  }
}

export function isPasswordPolicyMet(password) {
  const c = getPasswordCriteria(password)
  return (
    c.minLength && c.upper && c.lower && c.number && c.special
  )
}
