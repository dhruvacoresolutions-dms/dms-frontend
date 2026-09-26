"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import type { UnifiedImportJob } from "../../api/master-data-upload.types"

type Props = {
  fileName: string
  typeLabel: string
  job: UnifiedImportJob | undefined
  pollError: unknown
  onRetry: () => void
  onBack: () => void
}

/** Working state: upload + server-side validation progress. */
export function UploadProgressPanel({
  fileName,
  typeLabel,
  job,
  pollError,
  onRetry,
  onBack,
}: Props) {
  const pollingFailed = !!pollError && !job

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Spinner className="size-8" />
      <div>
        <p className="font-medium">
          {job ? "Validating records..." : "Uploading file..."}
        </p>
        <p className="text-sm text-muted-foreground">
          {fileName} · {typeLabel}
          {job && job.totalRows > 0
            ? ` · ${job.validRows + job.invalidRows}/${job.totalRows} checked`
            : " · this may take a moment"}
        </p>
      </div>
      {pollingFailed && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive">
            {getApiErrorMessage(pollError, "Could not fetch the import status")}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
