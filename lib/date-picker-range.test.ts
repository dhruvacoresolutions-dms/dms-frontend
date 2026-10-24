import { describe, expect, it } from "vitest"

import {
  getDefaultMonthRange,
  getHistoricalMonthRange,
} from "./date-picker-range"

const TODAY = new Date(2026, 9, 25)

function parts(date: Date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  }
}

describe("getDefaultMonthRange", () => {
  it("spans January 10 years ago through December 10 years ahead", () => {
    const range = getDefaultMonthRange(TODAY)

    expect(parts(range.startMonth)).toEqual({
      year: 2016,
      month: 0,
      day: 1,
    })
    expect(parts(range.endMonth)).toEqual({
      year: 2036,
      month: 11,
      day: 31,
    })
  })
})

describe("getHistoricalMonthRange", () => {
  it("spans January 100 years ago through today", () => {
    const range = getHistoricalMonthRange(TODAY)

    expect(parts(range.startMonth)).toEqual({
      year: 1926,
      month: 0,
      day: 1,
    })
    expect(parts(range.endMonth)).toEqual({
      year: 2026,
      month: 9,
      day: 25,
    })
  })
})
