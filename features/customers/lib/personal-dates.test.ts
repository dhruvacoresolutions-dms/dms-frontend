import { describe, expect, it } from "vitest"
import {
  apiDateToPicker,
  isValidPickerDate,
  pickerDateToApi,
  validatePersonalDates,
} from "./personal-dates"

describe("customer personal date conversion", () => {
  it("converts API date-only values without timezone changes", () => {
    expect(apiDateToPicker("05-03-1990")).toBe("1990-03-05")
    expect(pickerDateToApi("1990-03-05")).toBe("05-03-1990")
  })

  it("safely handles missing and malformed values", () => {
    expect(apiDateToPicker(null)).toBe("")
    expect(pickerDateToApi("")).toBeNull()
    expect(isValidPickerDate("2024-02-29")).toBe(true)
    expect(isValidPickerDate("2023-02-29")).toBe(false)
  })
})

describe("customer personal date validation", () => {
  const today = "2026-10-25"
  it("allows optional dates and today's date", () => {
    expect(validatePersonalDates(null, null, today)).toEqual({})
    expect(validatePersonalDates(today, undefined, today)).toEqual({})
  })
  it("rejects future dates and anniversary dates not later than birth", () => {
    expect(
      validatePersonalDates("2026-10-26", undefined, today).dateOfBirth
    ).toBe("Date of birth must not be in the future")
    expect(
      validatePersonalDates("1990-01-01", "1990-01-01", today).anniversaryDate
    ).toBe("Anniversary date must be after date of birth")
    expect(
      validatePersonalDates("1990-01-01", "1989-12-31", today).anniversaryDate
    ).toBe("Anniversary date must be after date of birth")
  })
})
