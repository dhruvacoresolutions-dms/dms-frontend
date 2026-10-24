import { AxiosError, type AxiosResponse } from "axios"
import { describe, expect, it } from "vitest"

import { getApiError, getApiErrorMessage } from "./api-error"

function axiosError(data: unknown, status = 400) {
  const response = {
    data,
    status,
    statusText: "Bad Request",
    headers: {},
    config: {},
  } as AxiosResponse

  return new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    response
  )
}

describe("api error envelope parsing", () => {
  it("reads a valid ApiErrorResponse", () => {
    const error = axiosError({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      correlationId: null,
      errors: [{ field: "startDate", message: "must be tomorrow or later" }],
      timestamp: "2026-10-25T10:00:00Z",
    })

    expect(getApiError(error)?.code).toBe("VALIDATION_ERROR")
    expect(getApiErrorMessage(error, "fallback")).toBe(
      "Request validation failed"
    )
  })

  it("does not render a raw payload as an error message", () => {
    const error = axiosError(
      {
        geographyUuid: "11111111-1111-1111-1111-111111111111",
        name: "North",
        code: "NORTH",
      },
      401
    )

    expect(getApiError(error)).toBeUndefined()
    expect(getApiErrorMessage(error, "Failed to save")).toBe("Failed to save")
  })

  it("ignores non-string field error messages", () => {
    const error = axiosError({
      message: "Request validation failed",
      code: "VALIDATION_ERROR",
      errors: [
        { field: "mobile", message: { field: "mobile", code: "X" } },
        { field: "gstin", message: "already used" },
      ],
    })

    expect(getApiError(error)?.errors).toEqual([
      { field: "gstin", message: "already used" },
    ])
  })

  it("ignores blank messages", () => {
    const error = axiosError({ message: "   ", code: "UNKNOWN" })
    expect(getApiErrorMessage(error, "Try again")).toBe("Try again")
  })

  it("uses the fallback for non-axios errors", () => {
    expect(getApiError(new Error("boom"))).toBeUndefined()
    expect(getApiErrorMessage(new Error("boom"), "Try again")).toBe("Try again")
  })
})
