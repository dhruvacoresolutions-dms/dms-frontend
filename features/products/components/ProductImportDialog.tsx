"use client"

import { BulkImportDialog } from "@/components/common/BulkImportDialog"
import {
  getProductImportTemplate,
  uploadProductImport,
  getProductPriceImportTemplate,
  uploadProductPriceImport,
  getProductChildImportTemplate,
  uploadProductChildImport,
  type ProductChildImportSegment,
} from "../api/product.api"

/** Every import surface the products module exposes (folder 20 + 22). */
export type ProductImportKind =
  | "products"
  | "prices"
  | "batches"
  | "fitments"
  | "gst-mappings"
  | "relationships"

type ProductImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyUuid: string
  kind: ProductImportKind
  onUploadComplete?: () => void
}

const CHILD_SEGMENTS: Record<
  Exclude<ProductImportKind, "products" | "prices">,
  ProductChildImportSegment
> = {
  batches: "product-batches",
  fitments: "product-fitments",
  "gst-mappings": "product-gst-mappings",
  relationships: "product-relationships",
}

type KindConfig = {
  noun: string
  templateFileName: string
  /** Extra sentence appended to the dialog description. */
  note?: string
}

const KIND_CONFIG: Record<ProductImportKind, KindConfig> = {
  products: { noun: "products", templateFileName: "products-import-template" },
  prices: {
    noun: "product prices",
    templateFileName: "product-prices-import-template",
  },
  batches: {
    noun: "product batches",
    templateFileName: "product-batches-import-template",
    note: "The referenced products must have batch tracking enabled.",
  },
  fitments: {
    noun: "product fitments",
    templateFileName: "product-fitments-import-template",
    note: "Automotive companies only.",
  },
  "gst-mappings": {
    noun: "product GST mappings",
    templateFileName: "product-gst-mappings-import-template",
    note: "Product code, HSN code, tax code and effective date are required.",
  },
  relationships: {
    noun: "product relationships",
    templateFileName: "product-relationships-import-template",
    note: "Both products must already exist.",
  },
}

export function ProductImportDialog({
  open,
  onOpenChange,
  companyUuid,
  kind,
  onUploadComplete,
}: ProductImportDialogProps) {
  const config = KIND_CONFIG[kind]
  const note = config.note ? ` ${config.note}` : ""

  const getTemplate = (format: "csv" | "xlsx"): Promise<Blob> => {
    if (kind === "products") return getProductImportTemplate(companyUuid, format)
    if (kind === "prices")
      return getProductPriceImportTemplate(companyUuid, format)
    return getProductChildImportTemplate(companyUuid, CHILD_SEGMENTS[kind], format)
  }

  const uploadFn = (file: File): Promise<unknown> => {
    if (kind === "products") return uploadProductImport(companyUuid, file)
    if (kind === "prices") return uploadProductPriceImport(companyUuid, file)
    return uploadProductChildImport(companyUuid, CHILD_SEGMENTS[kind], file)
  }

  return (
    <BulkImportDialog
      open={open}
      onOpenChange={onOpenChange}
      onUploadComplete={onUploadComplete}
      title={`Bulk upload ${config.noun}`}
      description={`Upload a CSV or XLSX file to import ${config.noun} in bulk. You can track progress below.${note}`}
      dropzoneLabel={`Drop ${config.noun} file here`}
      dropzoneDescription="CSV or XLSX up to 10 MB"
      accept=".csv,.xlsx"
      templateFileName={config.templateFileName}
      getTemplate={getTemplate}
      uploadFn={uploadFn}
    />
  )
}
