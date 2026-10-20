export const companyCalendarKeys = {
  all: (companyUuid: string) =>
    ["companies", companyUuid, "company-calendar"] as const,
  fiscalYears: (companyUuid: string) =>
    [...companyCalendarKeys.all(companyUuid), "fiscal-years"] as const,
  periods: (companyUuid: string, fiscalYearUuid: string) =>
    [
      ...companyCalendarKeys.all(companyUuid),
      "fiscal-years",
      fiscalYearUuid,
      "periods",
    ] as const,
  weeklyOffRule: (companyUuid: string) =>
    [...companyCalendarKeys.all(companyUuid), "weekly-off-rule"] as const,
  holidays: (companyUuid: string) =>
    [...companyCalendarKeys.all(companyUuid), "holidays"] as const,
  holidayList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...companyCalendarKeys.holidays(companyUuid), "list", params] as const,
  settings: (companyUuid: string) =>
    [...companyCalendarKeys.all(companyUuid), "settings"] as const,
  effective: (companyUuid: string) =>
    [...companyCalendarKeys.all(companyUuid), "effective"] as const,
  effectiveList: (companyUuid: string, params?: Record<string, unknown>) =>
    [...companyCalendarKeys.effective(companyUuid), "list", params] as const,
} as const
