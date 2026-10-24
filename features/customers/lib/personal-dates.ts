/** Convert date-only values without passing through local/UTC timestamp math. */
export function apiDateToPicker(value?: string | null): string {
  if (!value) return ""
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ""
}

export function pickerDateToApi(value?: string | null): string | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null
}

export function isValidPickerDate(value?: string | null): boolean {
  if (!value) return true
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return (
    date.getFullYear() === Number(y) &&
    date.getMonth() === Number(m) - 1 &&
    date.getDate() === Number(d)
  )
}

export type PersonalDateErrors = Partial<
  Record<"dateOfBirth" | "anniversaryDate", string>
>

export function validatePersonalDates(
  dateOfBirth?: string | null,
  anniversaryDate?: string | null,
  today = new Date().toLocaleDateString("en-CA")
): PersonalDateErrors {
  const errors: PersonalDateErrors = {}
  if (dateOfBirth && !isValidPickerDate(dateOfBirth))
    errors.dateOfBirth = "Enter a valid date"
  if (anniversaryDate && !isValidPickerDate(anniversaryDate))
    errors.anniversaryDate = "Enter a valid date"
  if (dateOfBirth && isValidPickerDate(dateOfBirth) && dateOfBirth > today)
    errors.dateOfBirth = "Date of birth must not be in the future"
  if (
    anniversaryDate &&
    isValidPickerDate(anniversaryDate) &&
    anniversaryDate > today
  )
    errors.anniversaryDate = "Anniversary date must not be in the future"
  if (
    dateOfBirth &&
    anniversaryDate &&
    isValidPickerDate(dateOfBirth) &&
    isValidPickerDate(anniversaryDate) &&
    anniversaryDate <= dateOfBirth
  )
    errors.anniversaryDate = "Anniversary date must be after date of birth"
  return errors
}
