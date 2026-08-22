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
  if (error instanceof AxiosError) {
    return error.response?.data as ApiErrorResponse | undefined
  }

  return undefined
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = getApiError(error)

  if (apiError?.message) {
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
