"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { getApiError, getApiErrorMessage } from "@/lib/api/api-error"
import { downloadBlob } from "@/lib/file-download"
import { GuidelinesHoverCard } from "./wizard/GuidelinesHoverCard"
import { UploadFormPanel } from "./wizard/UploadFormPanel"
import { UploadProgressPanel } from "./wizard/UploadProgressPanel"
import { ValidationResultPanel } from "./wizard/ValidationResultPanel"
import { isAcceptedFile } from "./wizard/file-utils"
import { useImportJob } from "../hooks/use-import-job"
import {
  extractImportJobUuid,
  getMasterTypeConfig,
} from "../api/master-data-upload.api"
import { masterUploadKeys } from "../api/master-data-upload-keys"
import type { MasterDataType } from "../api/master-data-upload.types"

type Phase = "idle" | "working" | "result"

type Props = {
  companyUuid: string
  type: MasterDataType
  onTypeChange: (type: MasterDataType) => void
}

/**
 * Upload workflow orchestrator. Owns the phase/file/job state, the upload
 * call, job polling and history refresh; each visual state lives in its own
 * `wizard/*` panel.
 */
export function UploadWizard({ companyUuid, type, onTypeChange }: Props) {
  const queryClient = useQueryClient()
  const config = getMasterTypeConfig(type)

  const [file, setFile] = React.useState<File | null>(null)
  const [phase, setPhase] = React.useState<Phase>("idle")
  const [jobUuid, setJobUuid] = React.useState<string | null>(null)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [downloadingReport, setDownloadingReport] = React.useState(false)
  const toastedJobRef = React.useRef<string | null>(null)

  // NOTE: the parent remounts this component (via `key`) whenever the
  // master type changes, so no reset-on-type-change effect is needed here.

  const jobQuery = useImportJob(
    companyUuid,
    type,
    jobUuid,
    phase === "working" || phase === "result"
  )
  const job = jobQuery.data

  // Terminal job → move to result, refresh history, toast once.
  React.useEffect(() => {
    if (!job?.terminal || !jobUuid) return
    if (toastedJobRef.current === jobUuid) return
    toastedJobRef.current = jobUuid
    setPhase("result")
    void queryClient.invalidateQueries({
      queryKey: masterUploadKeys.histories(companyUuid),
    })
    if (job.failed && job.invalidRows >= job.totalRows) {
      toast.error("Import failed — review the errors below")
    } else if (job.invalidRows > 0) {
      toast.warning(
        `Import finished with ${job.invalidRows} failed record${job.invalidRows > 1 ? "s" : ""}`
      )
    } else {
      toast.success(
        `Import completed — ${job.validRows} record${job.validRows === 1 ? "" : "s"} imported`
      )
    }
  }, [job, jobUuid, companyUuid, queryClient])

  const reset = (keepFile = false) => {
    if (!keepFile) setFile(null)
    setPhase("idle")
    setJobUuid(null)
    setUploadError(null)
    setUploading(false)
    toastedJobRef.current = null
    void queryClient.removeQueries({
      queryKey: masterUploadKeys.jobs(companyUuid),
    })
  }

  const handleFileChange = (next: File | null) => {
    setFile(next)
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (!file || uploading || !isAcceptedFile(file)) return
    setUploading(true)
    setUploadError(null)
    try {
      const result = await config.upload(companyUuid, file)
      const id = extractImportJobUuid(result)
      if (!id) throw new Error("Upload succeeded but no job id was returned")
      setJobUuid(id)
      setPhase("working")
    } catch (error) {
      const apiError = getApiError(error)
      const message = getApiErrorMessage(error, `Failed to upload ${file.name}`)
      setUploadError(
        apiError?.message && apiError.message !== message
          ? `${message}: ${apiError.message}`
          : message
      )
      setPhase("idle")
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadReport = async () => {
    if (!jobUuid || downloadingReport) return
    try {
      setDownloadingReport(true)
      const blob = await config.getResultsCsv(companyUuid, jobUuid)
      const base =
        file?.name.replace(/\.[^.]+$/, "") || `${type}-import-results`
      downloadBlob(blob, `${base}-results.csv`)
      toast.success("Error report downloaded")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to download error report"))
    } finally {
      setDownloadingReport(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Upload Master Data</CardTitle>
            <CardDescription>
              Select the master data type and upload your file
            </CardDescription>
          </div>
          <GuidelinesHoverCard />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {phase === "result" && job ? (
          <ValidationResultPanel
            job={job}
            fileName={file?.name ?? "Uploaded file"}
            typeLabel={config.label}
            downloadingReport={downloadingReport}
            onDownloadReport={() => void handleDownloadReport()}
            onReset={() => reset()}
          />
        ) : phase === "working" ? (
          <UploadProgressPanel
            fileName={file?.name ?? "Uploaded file"}
            typeLabel={config.label}
            job={job}
            pollError={jobQuery.error}
            onRetry={() => void jobQuery.refetch()}
            onBack={() => reset(true)}
          />
        ) : (
          <UploadFormPanel
            companyUuid={companyUuid}
            config={config}
            type={type}
            onTypeChange={onTypeChange}
            file={file}
            onFileChange={handleFileChange}
            uploadError={uploadError}
            uploading={uploading}
            onUpload={() => void handleUpload()}
          />
        )}
      </CardContent>
    </Card>
  )
}
