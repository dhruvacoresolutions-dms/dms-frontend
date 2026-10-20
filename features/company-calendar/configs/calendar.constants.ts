import type {
  ClaimWindowMode,
  SaturdayMode,
  WeeklyOffDay,
  CalendarStatus,
} from "../api/company-calendar.types"

export const CALENDAR_STATUS_OPTIONS: readonly {
  value: CalendarStatus
  label: string
}[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const

export const SATURDAY_MODE_OPTIONS: readonly {
  value: SaturdayMode
  label: string
  description: string
}[] = [
  {
    value: "NONE",
    label: "None",
    description: "Every Saturday is a working day.",
  },
  {
    value: "FIRST_THIRD",
    label: "1st & 3rd Saturday",
    description: "The first and third Saturday of each month are off.",
  },
  {
    value: "SECOND_FOURTH",
    label: "2nd & 4th Saturday",
    description: "The second and fourth Saturday of each month are off.",
  },
  {
    value: "ALL",
    label: "All Saturdays",
    description: "Every Saturday is a weekly off.",
  },
] as const

export const CLAIM_WINDOW_MODE_OPTIONS: readonly {
  value: ClaimWindowMode
  label: string
}[] = [
  { value: "N_DAYS", label: "Fixed number of days" },
  { value: "ACCOUNTING_PERIOD_END", label: "Until accounting period end" },
] as const

export const WEEK_DAYS: readonly {
  value: WeeklyOffDay
  label: string
  short: string
}[] = [
  { value: "MONDAY", label: "Monday", short: "Mon" },
  { value: "TUESDAY", label: "Tuesday", short: "Tue" },
  { value: "WEDNESDAY", label: "Wednesday", short: "Wed" },
  { value: "THURSDAY", label: "Thursday", short: "Thu" },
  { value: "FRIDAY", label: "Friday", short: "Fri" },
  { value: "SATURDAY", label: "Saturday", short: "Sat" },
  { value: "SUNDAY", label: "Sunday", short: "Sun" },
] as const

export const EFFECTIVE_REASON_LABELS = {
  HOLIDAY: "Holiday",
  WEEKLY_OFF: "Weekly off",
  ALTERNATE_SATURDAY: "Alternate Saturday",
} as const

export const NAME_MAX_LENGTH = 180
export const REOPEN_REASON_MAX_LENGTH = 2000
