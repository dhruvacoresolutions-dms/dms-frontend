"use client"

import * as React from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import type {
  MasterTypeConfig,
  UploadFormat,
} from "../../api/master-data-upload.api"

type Props = {
  companyUuid: string
  config: MasterTypeConfig
}

/** "Download {type} template: Excel · CSV" links below the type dropdown. */
export function MasterTypeTemplateLinks({ companyUuid, config }: Props) {
  const [downloading, setDownloading] =
    React.useState<UploadFormat | null>(null)

  const handleDownload = async (format: UploadFormat) => {
    if (downloading) return
    try {
      setDownloading(format)
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

  return (
    <PermissionGate permission={config.permission}>
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
        <span>Download {config.label} template:</span>
        <Button
          variant="link"
          size="sm"
          disabled={downloading !== null}
          onClick={() => void handleDownload("xlsx")}
          className="h-auto gap-1 p-0 text-xs"
        >
          {downloading === "xlsx" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          Excel
        </Button>
        <span>·</span>
        <Button
          variant="link"
          size="sm"
          disabled={downloading !== null}
          onClick={() => void handleDownload("csv")}
          className="h-auto gap-1 p-0 text-xs"
        >
          {downloading === "csv" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          CSV
        </Button>
      </div>
    </PermissionGate>
  )
}
