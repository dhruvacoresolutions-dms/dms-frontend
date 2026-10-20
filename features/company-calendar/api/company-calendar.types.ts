/**
 * Types mirroring the Sales Execution Service company-calendar contract
 * (`/api/v1/company-calendar/**`).
 *
 * Backend records use `LocalDate` (ISO `yyyy-MM-dd`) and `OffsetDateTime`
 * (ISO date-time) strings.
 */

export type CalendarStatus = "ACTIVE" | "INACTIVE"

export type PeriodStatus = "OPEN" | "CLOSED"

export type SaturdayMode = "NONE" | "FIRST_THIRD" | "SECOND_FOURTH" | "ALL"

export type ClaimWindowMode = "N_DAYS" | "ACCOUNTING_PERIOD_END"

export type WeeklyOffDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export type EffectiveDayReason =
  "HOLIDAY" | "WEEKLY_OFF" | "ALTERNATE_SATURDAY" | null

export type FiscalYear = {
  uuid: string
  name: string
  startDate: string
  endDate: string
  status: CalendarStatus
}

export type AccountingPeriod = {
  uuid: string
  fiscalYearUuid: string
  name: string
  startDate: string
  endDate: string
  status: PeriodStatus
  closedBy: string | null
  closedAt: string | null
  reopenedBy: string | null
  reopenedAt: string | null
  reopenReason: string | null
}

export type WeeklyOffRule = {
  /** `null` when the company has not saved a rule yet (service defaults returned). */
  uuid: string | null
  weeklyOffDays: WeeklyOffDay[]
  alternateSaturdayMode: SaturdayMode
}

export type Holiday = {
  uuid: string
  holidayDate: string
  name: string
  geographyUuid: string | null
  status: CalendarStatus
}

export type CalendarSettings = {
  uuid: string
  visitRadiusMeters: number
  companyTimezone: string
  claimWindowMode: ClaimWindowMode
  claimWindowDays: number
}

export type PeriodSummary = {
  uuid: string
  name: string
  status: PeriodStatus
}

export type EffectiveDay = {
  date: string
  isWorkingDay: boolean
  reason: EffectiveDayReason
  holidayName: string | null
  period: PeriodSummary | null
}

// ── Requests ────────────────────────────────────────────────────────────────

export type YearRequest = {
  name: string
  startDate: string
  endDate: string
  status: CalendarStatus
}

export type StatusRequest = {
  status: CalendarStatus
}

export type PeriodRequest = {
  name: string
  startDate: string
  endDate: string
}

export type ReopenRequest = {
  reason: string
}

export type WeeklyOffRuleRequest = {
  weeklyOffDays: WeeklyOffDay[]
  alternateSaturdayMode?: SaturdayMode
}

export type HolidayRequest = {
  holidayDate: string
  name: string
  geographyUuid?: string | null
  status: CalendarStatus
}

export type RadiusRequest = {
  visitRadiusMeters: number
}

export type ClaimPolicyRequest = {
  companyTimezone: string
  claimWindowMode: ClaimWindowMode
  claimWindowDays: number
}

// ── Query params ────────────────────────────────────────────────────────────

export type HolidayListParams = {
  from?: string
  to?: string
  geographyUuid?: string
  status?: CalendarStatus
  page?: number
  size?: number
}

export type EffectiveCalendarParams = {
  from: string
  to: string
  geographyUuid?: string
}
