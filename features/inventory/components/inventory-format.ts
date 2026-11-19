import { format, isValid, parseISO } from "date-fns"

import type {
  StockDocument,
  StockDocumentLine,
  StockTypeCode,
} from "../api/inventory.types"

export function formatDate(value?: string | null): string {
  if (!value) return "—"
  const parsed = parseISO(value)
  return isValid(parsed) ? format(parsed, "dd MMM yyyy") : value
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return format(parsed, "dd MMM yyyy, hh:mm a")
}

export function formatQuantity(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return "—"
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value)
}

export function documentDate(document: StockDocument): string | undefined {
  return (
    document.documentDate ??
    document.adjustmentDate ??
    document.transferDate ??
    undefined
  )
}

export function lineMovement(line: StockDocumentLine): string {
  if (line.fromType || line.toType) {
    return `${line.fromType ?? "—"} → ${line.toType ?? "—"}`
  }
  return line.stockType ?? "—"
}

export function totalLineQuantity(lines: StockDocumentLine[] = []): number {
  return lines.reduce((sum, line) => sum + (line.quantity ?? 0), 0)
}

export function transactionTypeLabel(
  transactionType?: string | null
): string {
  switch (transactionType) {
    case "OPENING_STOCK":
      return "Opening Stock"
    case "STOCK_IN":
      return "Stock In"
    case "STOCK_OUT":
      return "Stock Out"
    default:
      return "—"
  }
}

const STOCK_TYPE_NAMES: Record<StockTypeCode, string> = {
  S: "Saleable",
  O: "Offer",
  U: "Un-Saleable",
  P: "Sample",
  D: "Damaged-Sample",
}

export function stockTypeName(code?: string | null): string {
  if (!code) return "—"
  return STOCK_TYPE_NAMES[code as StockTypeCode] ?? code
}
