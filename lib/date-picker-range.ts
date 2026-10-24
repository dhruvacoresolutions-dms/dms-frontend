import {
  addYears,
  endOfYear,
  startOfDay,
  startOfYear,
  subYears,
} from "date-fns"

export type MonthRange = {
  startMonth: Date
  endMonth: Date
}

const DEFAULT_YEARS_BACK = 10
const DEFAULT_YEARS_FORWARD = 10
const HISTORICAL_YEARS_BACK = 100

/**
 * Default calendar bounds for a date picker: January 10 years ago through
 * December 10 years ahead.
 */
export function getDefaultMonthRange(today: Date = new Date()): MonthRange {
  const day = startOfDay(today)

  return {
    startMonth: startOfYear(subYears(day, DEFAULT_YEARS_BACK)),
    endMonth: endOfYear(addYears(day, DEFAULT_YEARS_FORWARD)),
  }
}

/**
 * Calendar bounds for historical dates such as date of birth and anniversaries:
 * 100 years ago through today.
 */
export function getHistoricalMonthRange(today: Date = new Date()): MonthRange {
  const endMonth = startOfDay(today)

  return {
    startMonth: startOfYear(subYears(endMonth, HISTORICAL_YEARS_BACK)),
    endMonth,
  }
}
