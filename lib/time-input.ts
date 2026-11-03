/**
 * Mask free-typed time input: at most four digits, with the `:` inserted
 * automatically after the hour. `"0930"` → `"09:30"`, `"9"` → `"9"`.
 */
export function maskTimeInput(value: string): string {
  // A colon is already present (typed or pasted): honour the hour/minute split
  // so "9:30" becomes "09:30" instead of being read as the digits "930".
  const withColon = /^(\d{0,2}):(\d{0,2})$/.exec(value.trim())
  if (withColon) {
    const hours = withColon[1].slice(0, 2)
    const minutes = withColon[2].slice(0, 2)
    if (!hours) return ""
    if (!minutes) return hours
    return `${hours.padStart(2, "0")}:${minutes}`
  }

  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

/** `"930"` → `"09:30"`, so a missing leading zero still commits cleanly. */
export function normalizeTimeInput(value: string): string {
  const masked = maskTimeInput(value)
  const digits = masked.replace(/\D/g, "")
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`
  return masked
}

/** True when the value is a complete 24-hour `HH:MM` time. */
export function isCompleteTime(value: string): boolean {
  return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)
}
