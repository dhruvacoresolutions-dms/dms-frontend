"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getProductAttributeTemplateImportTemplate,
  uploadProductAttributeTemplateImport,
} from "../api/product-attribute-template.api"

type ProductAttributeTemplateImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  onImportComplete?: () => void
}

export function ProductAttributeTemplateImportDialog({
  open,
  onOpenChange,
  companyUuid,
  onImportComplete,
}: ProductAttributeTemplateImportDialogProps) {
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onImportComplete}
      title="Bulk upload attribute templates"
      description="Upload a CSV or XLSX file to import attribute templates in bulk. You can track progress below."
      dropzoneLabel="Drop attribute templates file here"
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName="product-attribute-templates-import-template"
      getTemplate={(format) =>
        getProductAttributeTemplateImportTemplate(companyUuid, format)
      }
      uploadFn={(file) =>
        uploadProductAttributeTemplateImport(companyUuid, file)
      }
    />
  )
}
