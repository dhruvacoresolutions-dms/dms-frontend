"use client"

import { FileText, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Field, FieldLabel } from "@/components/ui/field"
import { Dropzone } from "@/components/common/Dropzone"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { MasterTypeCombobox } from "../MasterTypeCombobox"
import { MasterTypeTemplateLinks } from "./MasterTypeTemplateLinks"
import { ACCEPT, MAX_SIZE, formatBytes, isAcceptedFile } from "./file-utils"
import type { MasterTypeConfig } from "../../api/master-data-upload.api"
import type { MasterDataType } from "../../api/master-data-upload.types"

type Props = {
  companyUuid: string
  config: MasterTypeConfig
  type: MasterDataType
  onTypeChange: (type: MasterDataType) => void
  file: File | null
  onFileChange: (file: File | null) => void
  uploadError: string | null
  uploading: boolean
  onUpload: () => void
}

/** Idle state: type combobox + template links + file dropzone + Upload CTA. */
export function UploadFormPanel({
  companyUuid,
  config,
  type,
  onTypeChange,
  file,
  onFileChange,
  uploadError,
  uploading,
  onUpload,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>Master Data Type</FieldLabel>
          <MasterTypeCombobox value={type} onValueChange={onTypeChange} />
          <MasterTypeTemplateLinks companyUuid={companyUuid} config={config} />
        </Field>
        <Field>
          <FieldLabel>Select File</FieldLabel>
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${file.name}`}
                onClick={() => onFileChange(null)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Dropzone
              value={file}
              onFileSelect={(f) => onFileChange(f)}
              accept={ACCEPT}
              multiple={false}
              maxSize={MAX_SIZE}
              compact
              label="Drag & drop your file here"
              description=".xlsx, .csv · Max 10 MB"
              placeholder=""
            />
          )}
        </Field>
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription className="break-words">
            {uploadError}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <PermissionGate permission={config.permission}>
          <Button
            disabled={!file || !isAcceptedFile(file) || uploading}
            onClick={onUpload}
            className="w-full sm:w-auto"
          >
            {uploading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </PermissionGate>
      </div>
    </div>
  )
}
