"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getProductImportTemplate,
  uploadProductImport,
  getProductPriceImportTemplate,
  uploadProductPriceImport,
} from "../api/product.api"

type ProductImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  kind: "products" | "prices"
  onUploadComplete?: () => void
}

export function ProductImportDialog({
  open,
  onOpenChange,
  companyUuid,
  kind,
  onUploadComplete,
}: ProductImportDialogProps) {
  const isPrices = kind === "prices"
  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title={isPrices ? "Bulk upload product prices" : "Bulk upload products"}
      description={
        isPrices
          ? "Upload a CSV or XLSX file to import product prices in bulk. You can track progress below."
          : "Upload a CSV or XLSX file to import products in bulk. You can track progress below."
      }
      dropzoneLabel={
        isPrices ? "Drop prices file here" : "Drop products file here"
      }
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName={
        isPrices ? "product-prices-import-template" : "products-import-template"
      }
      getTemplate={(format) =>
        isPrices
          ? getProductPriceImportTemplate(companyUuid, format)
          : getProductImportTemplate(companyUuid, format)
      }
      uploadFn={(file) =>
        isPrices
          ? uploadProductPriceImport(companyUuid, file)
          : uploadProductImport(companyUuid, file)
      }
    />
  )
}
