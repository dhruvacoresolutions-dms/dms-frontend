"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import { StatusBadge } from "@/components/common/StatusBadge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { PERMISSIONS } from "@/lib/permissions"
import { useCustomerKycDocuments } from "../hooks/use-customer-kyc-documents"
import { useCustomerLookups } from "../hooks/use-customer-lookups"
import { useUpdateCustomerKycStatus } from "../hooks/use-update-customer-kyc-status"
import { useDeleteCustomerKycDocument } from "../hooks/use-delete-customer-kyc-document"
import { CustomerKycDocumentDialog } from "./CustomerKycDocumentDialog"
import type { CustomerKycDocument } from "../api/customer.types"

type PendingStatus = {
  document: CustomerKycDocument
  status: "VERIFIED" | "REJECTED"
}

type Props = {
  companyUuid: string
  customerUuid: string
  customerVersion: number
  editable: boolean
}

export function CustomerKycSection({
  companyUuid,
  customerUuid,
  customerVersion,
  editable,
}: Props) {
  const { data: documents, isLoading, error, refetch } =
    useCustomerKycDocuments(companyUuid, customerUuid)
  const { data: lookupData } = useCustomerLookups(
    companyUuid,
    "KYC_DOCUMENT_TYPE"
  )
  const statusMutation = useUpdateCustomerKycStatus(companyUuid)
  const deleteMutation = useDeleteCustomerKycDocument(companyUuid)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerKycDocument | null>(null)
  const [deleting, setDeleting] = useState<CustomerKycDocument | null>(null)
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null)
  const [statusRemarks, setStatusRemarks] = useState("")

  const typeNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of lookupData?.content ?? []) map.set(row.code, row.name)
    return map
  }, [lookupData?.content])

  const rows = documents ?? []
  const verified = rows.filter((d) => d.status === "VERIFIED").length

  const columns = useMemo<DataTableColumn<CustomerKycDocument>[]>(
    () => [
      {
        id: "type",
        header: "Document",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">
              {typeNames.get(row.original.kycDocumentTypeCode) ??
                row.original.kycDocumentTypeCode}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.documentNumber}
            </p>
          </div>
        ),
      },
      {
        id: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-muted-foreground">
            {row.original.remarks || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const doc = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="cursor-pointer"
                aria-label="Document actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-48">
                <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
                  <DropdownMenuItem
                    disabled={!editable}
                    onClick={() => {
                      setEditing(doc)
                      setDialogOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={!editable || doc.status === "VERIFIED"}
                    onClick={() => {
                      setStatusRemarks("")
                      setPendingStatus({ document: doc, status: "VERIFIED" })
                    }}
                  >
                    <CheckCircle2 className="mr-2 size-4" /> Verify
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!editable || doc.status === "REJECTED"}
                    onClick={() => {
                      setStatusRemarks("")
                      setPendingStatus({ document: doc, status: "REJECTED" })
                    }}
                  >
                    <XCircle className="mr-2 size-4" /> Reject
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={!editable}
                    onClick={() => setDeleting(doc)}
                  >
                    <Trash2 className="mr-2 size-4" /> Delete
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [editable, typeNames]
  )

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5" /> KYC Documents
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length > 0
              ? `${verified} of ${rows.length} document${rows.length === 1 ? "" : "s"} verified`
              : "No KYC documents captured yet."}
          </p>
        </div>
        <PermissionGate permission={PERMISSIONS.CUSTOMER.UPDATE}>
          <Button
            variant="outline"
            disabled={!editable}
            title={
              editable
                ? undefined
                : "KYC documents can only be changed while the customer is in DRAFT or REWORK."
            }
            onClick={() => {
              setEditing(null)
              setDialogOpen(true)
            }}
          >
            <Plus className="mr-2 size-4" /> Add document
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(d) => d.uuid}
          isLoading={isLoading}
          error={error}
          onRetry={() => void refetch()}
          empty={{
            icon: ShieldCheck,
            title: "No KYC documents",
            description:
              "Add PAN, GST, shop licence or other documents for verification.",
          }}
        />
        {!editable ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Documents are locked once the customer leaves DRAFT/REWORK.
          </p>
        ) : null}
      </CardContent>

      <CustomerKycDocumentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditing(null)
        }}
        companyUuid={companyUuid}
        customerUuid={customerUuid}
        customerVersion={customerVersion}
        document={editing}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete KYC document?"
        description={
          deleting
            ? `${deleting.documentNumber} will be removed from this customer.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(
            {
              customerUuid,
              documentUuid: deleting.uuid,
              version: customerVersion,
            },
            {
              onSuccess: () => {
                toast.success("KYC document deleted")
                setDeleting(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Failed to delete document")),
            }
          )
        }}
      />

      <Dialog
        open={!!pendingStatus}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingStatus?.status === "VERIFIED"
                ? "Verify document"
                : "Reject document"}
            </DialogTitle>
            <DialogDescription>
              {pendingStatus
                ? `${pendingStatus.document.documentNumber} will be marked as ${pendingStatus.status.toLowerCase()}.`
                : undefined}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="kyc-status-remarks"
              className="text-sm font-medium"
            >
              Remarks{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <Textarea
              id="kyc-status-remarks"
              rows={3}
              maxLength={2000}
              value={statusRemarks}
              onChange={(e) => setStatusRemarks(e.target.value)}
              placeholder="Add a note for the audit trail"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingStatus(null)}
              disabled={statusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                pendingStatus?.status === "REJECTED"
                  ? "destructive"
                  : "default"
              }
              disabled={statusMutation.isPending}
              onClick={() => {
                if (!pendingStatus) return
                statusMutation.mutate(
                  {
                    customerUuid,
                    documentUuid: pendingStatus.document.uuid,
                    input: {
                      status: pendingStatus.status,
                      remarks: statusRemarks.trim() || undefined,
                      version: customerVersion,
                    },
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        pendingStatus.status === "VERIFIED"
                          ? "Document verified"
                          : "Document rejected"
                      )
                      setPendingStatus(null)
                    },
                    onError: (err) =>
                      toast.error(
                        getApiErrorMessage(err, "Failed to update document")
                      ),
                  }
                )
              }}
            >
              {statusMutation.isPending
                ? "Updating..."
                : pendingStatus?.status === "VERIFIED"
                  ? "Verify"
                  : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
