import { describe, expect, it } from "vitest"
import { isCompleteTime, maskTimeInput, normalizeTimeInput } from "./time-input"

describe("maskTimeInput", () => {
  it("keeps at most four digits", () => {
    expect(maskTimeInput("123456")).toBe("12:34")
    expect(maskTimeInput("1")).toBe("1")
    expect(maskTimeInput("12")).toBe("12")
  })

  it("inserts the colon automatically after two digits", () => {
    expect(maskTimeInput("0930")).toBe("09:30")
    expect(maskTimeInput("9:30")).toBe("09:30")
    expect(maskTimeInput("23:59")).toBe("23:59")
  })

  it("drops non-digit characters", () => {
    expect(maskTimeInput("09-30")).toBe("09:30")
    expect(maskTimeInput("ab0930cd")).toBe("09:30")
  })
})

describe("normalizeTimeInput", () => {
  it("pads a three-digit time missing its leading zero", () => {
    expect(normalizeTimeInput("930")).toBe("09:30")
    expect(normalizeTimeInput("09:30")).toBe("09:30")
  })
})

describe("isCompleteTime", () => {
  it("accepts only a complete 24-hour time", () => {
    expect(isCompleteTime("00:00")).toBe(true)
    expect(isCompleteTime("23:59")).toBe(true)
    expect(isCompleteTime("24:00")).toBe(false)
    expect(isCompleteTime("9:30")).toBe(false)
    expect(isCompleteTime("09:3")).toBe(false)
  })
})
