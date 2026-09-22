"use client"

import { useState } from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"

export type ExportFormat = "csv" | "xlsx"

type ExportDropdownProps = {
  /** Permission code guarding the export (e.g. PERMISSIONS.GEOGRAPHY.EXPORT) */
  permission: string
  /** Base filename without extension, e.g. "geographies-export" */
  baseFileName: string
  /** Button label, default "Export" */
  label?: string
  /** Fetch the export file blob for the given format */
  onExport: (format: ExportFormat) => Promise<Blob>
}

export function ExportDropdown({
  permission,
  baseFileName,
  label = "Export",
  onExport,
}: ExportDropdownProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return
    try {
      setExporting(format)
      const blob = await onExport(format)
      downloadBlob(blob, `${baseFileName}.${format}`)
      toast.success(
        `${label} complete (${format === "csv" ? "CSV" : "Excel"})`
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Export failed"))
    } finally {
      setExporting(null)
    }
  }

  return (
    <PermissionGate permission={permission}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" disabled={exporting !== null}>
              {exporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              {exporting ? "Exporting..." : label}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-auto min-w-40">
          <DropdownMenuItem
            disabled={exporting !== null}
            onClick={() => void handleExport("csv")}
          >
            {exporting === "csv" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileText className="mr-2 size-4" />
            )}
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={exporting !== null}
            onClick={() => void handleExport("xlsx")}
          >
            {exporting === "xlsx" ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 size-4" />
            )}
            Export Excel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionGate>
  )
}
