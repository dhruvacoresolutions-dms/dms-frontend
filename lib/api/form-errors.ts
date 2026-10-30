import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { getApiError, type FieldErrorDetail } from "./api-error"

/**
 * Field-level errors returned by the backend (`ApiErrorResponse.errors`).
 * Many endpoints return an empty list; in that case the form falls back to the
 * toast message from `getApiErrorMessage`.
 */
/**
 * Maps an API field path onto a react-hook-form path.
 *
 * The API uses dotted/indexed names (`kyc[0].holderFirstName`) and prefixes
 * with-files payloads with `data.`; react-hook-form expects `kyc.0.holderFirstName`
 * and no envelope prefix.
 */
function normalizeFieldPath(field: string) {
  return field.trim().replace(/^data\./, "").replace(/\[(\d+)\]/g, ".$1")
}

export function getApiFieldErrors(error: unknown): FieldErrorDetail[] {
  return getApiError(error)?.errors ?? []
}

/**
 * Copies backend field errors onto the matching react-hook-form fields so the
 * user sees the message next to the offending input (and the field is focused).
 *
 * Returns `true` when at least one field error was applied — useful to decide
 * whether a toast is still needed.
 */
export function applyApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): boolean {
  const fieldErrors = getApiFieldErrors(error)
  let applied = false
  for (const fieldError of fieldErrors) {
    if (!fieldError?.field || !fieldError.message) continue
    setError(normalizeFieldPath(fieldError.field) as Path<T>, {
      type: "server",
      message: fieldError.message,
    })
    applied = true
  }
  return applied
}
