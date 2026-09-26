"use client"

import * as React from "react"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { usePermission } from "@/hooks/use-permission"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import {
  MASTER_DATA_TYPES,
  type MasterTypeConfig,
  type UploadFormat,
} from "../api/master-data-upload.api"

type Props = {
  companyUuid: string
}

const FORMATS: { format: UploadFormat; label: string }[] = [
  { format: "xlsx", label: "Excel (.xlsx)" },
  { format: "csv", label: "CSV (.csv)" },
]

/**
 * Header "Download Templates" dropdown. Each master type opens a submenu
 * with both CSV and Excel backend-generated templates (never hardcoded URLs).
 */
export function TemplateDownloadDropdown({ companyUuid }: Props) {
  const { has } = usePermission()
  const [downloading, setDownloading] = React.useState<{
    type: string
    format: UploadFormat
  } | null>(null)
  const [downloadingAll, setDownloadingAll] =
    React.useState<UploadFormat | null>(null)

  const busy = downloading !== null || downloadingAll !== null
  // Bulk download respects per-type permissions: only allowed templates.
  const allowedTypes = MASTER_DATA_TYPES.filter((t) => has(t.permission))

  const handleDownload = async (
    config: MasterTypeConfig,
    format: UploadFormat
  ) => {
    if (downloading) return
    try {
      setDownloading({ type: config.type, format })
      const blob = await config.getTemplate(companyUuid, format)
      downloadBlob(blob, `${config.templateFileName}.${format}`)
      toast.success(
        `Template downloaded (${format === "csv" ? "CSV" : "Excel"})`
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download template"))
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadAll = async (format: UploadFormat) => {
    if (busy || allowedTypes.length === 0) return
    setDownloadingAll(format)
    let succeeded = 0
    for (const t of allowedTypes) {
      try {
        const blob = await t.getTemplate(companyUuid, format)
        downloadBlob(blob, `${t.templateFileName}.${format}`)
        succeeded += 1
        // Small gap so the browser doesn't collapse the file saves.
        await new Promise((r) => setTimeout(r, 300))
      } catch {
        // Keep going with the remaining templates.
      }
    }
    setDownloadingAll(null)
    const kind = format === "csv" ? "CSV" : "Excel"
    if (succeeded === allowedTypes.length) {
      toast.success(`All templates downloaded (${kind})`)
    } else if (succeeded > 0) {
      toast.warning(
        `Downloaded ${succeeded} of ${allowedTypes.length} templates (${kind})`
      )
    } else {
      toast.error("Failed to download templates")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" disabled={busy}>
            {busy ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            {busy ? "Downloading..." : "Download Templates"}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={busy || allowedTypes.length === 0}>
            <Download className="mr-2 size-4" />
            Download all templates
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="min-w-44">
            {FORMATS.map(({ format, label }) => (
              <DropdownMenuItem
                key={format}
                disabled={busy || allowedTypes.length === 0}
                onClick={() => void handleDownloadAll(format)}
              >
                {downloadingAll === format ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : format === "xlsx" ? (
                  <FileSpreadsheet className="mr-2 size-4" />
                ) : (
                  <FileText className="mr-2 size-4" />
                )}
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {MASTER_DATA_TYPES.map((t) => (
          <PermissionGate key={t.type} permission={t.permission}>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FileSpreadsheet className="mr-2 size-4" />
                {t.label}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="min-w-44">
                {FORMATS.map(({ format, label }) => {
                  const busy =
                    downloading?.type === t.type &&
                    downloading?.format === format
                  return (
                    <DropdownMenuItem
                      key={format}
                      disabled={busy}
                      onClick={() => void handleDownload(t, format)}
                    >
                      {busy ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : format === "xlsx" ? (
                        <FileSpreadsheet className="mr-2 size-4" />
                      ) : (
                        <FileText className="mr-2 size-4" />
                      )}
                      {label}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </PermissionGate>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
