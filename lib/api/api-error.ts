import { AxiosError } from "axios"

export type FieldErrorDetail = {
  field: string
  message: string
}

export type ApiErrorResponse = {
  success: boolean
  code: string
  message: string
  correlationId: string | null
  errors: FieldErrorDetail[]
  timestamp: string
}

export type ApiSuccessResponse<T> = {
  success: boolean
  code: string
  message: string
  correlationId: string | null
  data: T
  timestamp: string
}

export function getApiError(error: unknown): ApiErrorResponse | undefined {
  if (!(error instanceof AxiosError)) {
    return undefined
  }

  const data: unknown = error.response?.data

  // Only treat the response as an API error envelope when it actually carries
  // a text message. This prevents raw payloads (for example a geography
  // object returned through a proxy) from being rendered as an error string.
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof (data as { message?: unknown }).message !== "string"
  ) {
    return undefined
  }

  const record = data as Record<string, unknown>
  const rawErrors = Array.isArray(record.errors) ? record.errors : []
  const errors = rawErrors.filter(
    (detail): detail is FieldErrorDetail =>
      !!detail &&
      typeof detail === "object" &&
      typeof (detail as { field?: unknown }).field === "string" &&
      typeof (detail as { message?: unknown }).message === "string"
  )

  return {
    ...(data as ApiErrorResponse),
    message: record.message as string,
    errors,
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = getApiError(error)

  if (apiError?.message.trim()) {
    return apiError.message
  }

  if (error instanceof AxiosError) {
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again."
    }

    if (!error.response) {
      return "Unable to reach the server. Please check your connection."
    }
  }

  return fallback
}
