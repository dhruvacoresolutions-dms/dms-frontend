"use client"

import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UnifiedImportJob } from "../../api/master-data-upload.types"

type Props = {
  job: UnifiedImportJob
  fileName: string
  typeLabel: string
  downloadingReport: boolean
  onDownloadReport: () => void
  onReset: () => void
}

/** Result state: counts, diagnostics, error report, Done/Back actions. */
export function ValidationResultPanel({
  job,
  fileName,
  typeLabel,
  downloadingReport,
  onDownloadReport,
  onReset,
}: Props) {
  const allFailed = job.failed && job.invalidRows >= job.totalRows
  const diagnostics = job.diagnostics ?? []

  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          allFailed
            ? "flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
            : "flex items-start gap-3 rounded-lg border border-green-200 bg-green-50/60 p-4 dark:border-green-800 dark:bg-green-950/30"
        }
      >
        {allFailed ? (
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-400" />
        )}
        <div>
          <p className="font-medium">
            {allFailed
              ? "Validation failed"
              : job.invalidRows > 0
                ? "Import completed with errors"
                : "Validation successful"}
          </p>
          <p className="text-sm text-muted-foreground">
            {typeLabel} · {fileName} · {job.validRows} of {job.totalRows}{" "}
            records valid
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border p-3 text-center">
          <p className="text-2xl font-bold">{job.totalRows}</p>
          <p className="text-xs text-muted-foreground">Total records</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 text-center dark:border-green-800 dark:bg-green-950/30">
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {job.validRows}
          </p>
          <p className="text-xs text-muted-foreground">Valid records</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-center dark:border-red-800 dark:bg-red-950/30">
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">
            {job.invalidRows}
          </p>
          <p className="text-xs text-muted-foreground">Invalid records</p>
        </div>
      </div>

      {diagnostics.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-destructive">
            {diagnostics.length} row{diagnostics.length > 1 ? "s" : ""} failed
            validation
          </p>
          <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto rounded-md bg-destructive/5 p-2 text-xs text-destructive/90">
            {diagnostics.map((d, i) => (
              <li key={i} className="break-words">
                Row {d.rowNumber}
                {d.entityKey ? ` · ${d.entityKey}` : ""}
                {d.field ? ` · ${d.field}` : ""}
                {d.reason
                  ? ` — ${d.reason}`
                  : d.errorCode
                    ? ` — ${d.errorCode}`
                    : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onReset}>
          {job.invalidRows > 0 ? "Upload corrected file" : "Upload another file"}
        </Button>
        {job.invalidRows > 0 && (
          <Button
            variant="outline"
            disabled={downloadingReport}
            onClick={onDownloadReport}
          >
            {downloadingReport ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Download className="mr-2 size-4" />
            )}
            Download error report
          </Button>
        )}
        <Button onClick={onReset}>Done</Button>
      </div>
    </div>
  )
}
