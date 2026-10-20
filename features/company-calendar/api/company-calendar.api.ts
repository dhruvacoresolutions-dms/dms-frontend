import { apiClient } from "@/lib/api-client"
import type { ApiSuccessResponse } from "@/lib/api-client"
import type { PageResponse } from "@/features/companies/api/company.types"
import type {
  AccountingPeriod,
  CalendarSettings,
  ClaimPolicyRequest,
  EffectiveCalendarParams,
  EffectiveDay,
  FiscalYear,
  Holiday,
  HolidayListParams,
  HolidayRequest,
  PeriodRequest,
  RadiusRequest,
  ReopenRequest,
  StatusRequest,
  WeeklyOffRule,
  WeeklyOffRuleRequest,
  YearRequest,
} from "./company-calendar.types"

/**
 * Company calendar API. The company is resolved from the bearer token by the
 * backend, so no company UUID is part of the URL; the shared axios client
 * attaches `Authorization` and `X-Company-Context`.
 */
const BASE = "/api/v1/company-calendar"

// ── Fiscal years ────────────────────────────────────────────────────────────

export async function getFiscalYears(): Promise<FiscalYear[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<FiscalYear[]>>(
    `${BASE}/fiscal-years`
  )
  return data.data
}

export async function createFiscalYear(
  input: YearRequest
): Promise<FiscalYear> {
  const { data } = await apiClient.post<ApiSuccessResponse<FiscalYear>>(
    `${BASE}/fiscal-years`,
    input
  )
  return data.data
}

export async function updateFiscalYear(
  fiscalYearUuid: string,
  input: YearRequest
): Promise<FiscalYear> {
  const { data } = await apiClient.put<ApiSuccessResponse<FiscalYear>>(
    `${BASE}/fiscal-years/${fiscalYearUuid}`,
    input
  )
  return data.data
}

export async function updateFiscalYearStatus(
  fiscalYearUuid: string,
  input: StatusRequest
): Promise<FiscalYear> {
  const { data } = await apiClient.patch<ApiSuccessResponse<FiscalYear>>(
    `${BASE}/fiscal-years/${fiscalYearUuid}/status`,
    input
  )
  return data.data
}

// ── Accounting periods ──────────────────────────────────────────────────────

export async function getAccountingPeriods(
  fiscalYearUuid: string
): Promise<AccountingPeriod[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AccountingPeriod[]>>(
    `${BASE}/fiscal-years/${fiscalYearUuid}/periods`
  )
  return data.data
}

export async function createAccountingPeriod(
  fiscalYearUuid: string,
  input: PeriodRequest
): Promise<AccountingPeriod> {
  const { data } = await apiClient.post<ApiSuccessResponse<AccountingPeriod>>(
    `${BASE}/fiscal-years/${fiscalYearUuid}/periods`,
    input
  )
  return data.data
}

export async function updateAccountingPeriod(
  periodUuid: string,
  input: PeriodRequest
): Promise<AccountingPeriod> {
  const { data } = await apiClient.put<ApiSuccessResponse<AccountingPeriod>>(
    `${BASE}/periods/${periodUuid}`,
    input
  )
  return data.data
}

export async function closeAccountingPeriod(
  periodUuid: string
): Promise<AccountingPeriod> {
  const { data } = await apiClient.post<ApiSuccessResponse<AccountingPeriod>>(
    `${BASE}/periods/${periodUuid}/close`
  )
  return data.data
}

export async function reopenAccountingPeriod(
  periodUuid: string,
  input: ReopenRequest
): Promise<AccountingPeriod> {
  const { data } = await apiClient.post<ApiSuccessResponse<AccountingPeriod>>(
    `${BASE}/periods/${periodUuid}/reopen`,
    input
  )
  return data.data
}

// ── Weekly off rule ─────────────────────────────────────────────────────────

export async function getWeeklyOffRule(): Promise<WeeklyOffRule> {
  const { data } = await apiClient.get<ApiSuccessResponse<WeeklyOffRule>>(
    `${BASE}/weekly-off-rule`
  )
  return data.data
}

export async function updateWeeklyOffRule(
  input: WeeklyOffRuleRequest
): Promise<WeeklyOffRule> {
  const { data } = await apiClient.put<ApiSuccessResponse<WeeklyOffRule>>(
    `${BASE}/weekly-off-rule`,
    input
  )
  return data.data
}

// ── Holidays ────────────────────────────────────────────────────────────────

export async function getHolidays(
  params?: HolidayListParams
): Promise<PageResponse<Holiday>> {
  const { data } = await apiClient.get<
    ApiSuccessResponse<PageResponse<Holiday>>
  >(`${BASE}/holidays`, { params })
  return data.data
}

export async function createHoliday(input: HolidayRequest): Promise<Holiday> {
  const { data } = await apiClient.post<ApiSuccessResponse<Holiday>>(
    `${BASE}/holidays`,
    input
  )
  return data.data
}

export async function updateHoliday(
  holidayUuid: string,
  input: HolidayRequest
): Promise<Holiday> {
  const { data } = await apiClient.put<ApiSuccessResponse<Holiday>>(
    `${BASE}/holidays/${holidayUuid}`,
    input
  )
  return data.data
}

/** Soft delete: sets `status` to INACTIVE, the row is retained. */
export async function inactivateHoliday(holidayUuid: string): Promise<Holiday> {
  const { data } = await apiClient.delete<ApiSuccessResponse<Holiday>>(
    `${BASE}/holidays/${holidayUuid}`
  )
  return data.data
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function getCalendarSettings(): Promise<CalendarSettings> {
  const { data } = await apiClient.get<ApiSuccessResponse<CalendarSettings>>(
    `${BASE}/settings`
  )
  return data.data
}

export async function updateVisitRadius(
  input: RadiusRequest
): Promise<CalendarSettings> {
  const { data } = await apiClient.put<ApiSuccessResponse<CalendarSettings>>(
    `${BASE}/settings/radius`,
    input
  )
  return data.data
}

export async function updateClaimPolicy(
  input: ClaimPolicyRequest
): Promise<CalendarSettings> {
  const { data } = await apiClient.put<ApiSuccessResponse<CalendarSettings>>(
    `${BASE}/settings/claim-policy`,
    input
  )
  return data.data
}

// ── Effective calendar ──────────────────────────────────────────────────────

export async function getEffectiveCalendar(
  params: EffectiveCalendarParams
): Promise<EffectiveDay[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<EffectiveDay[]>>(
    `${BASE}/effective`,
    { params }
  )
  return data.data
}
