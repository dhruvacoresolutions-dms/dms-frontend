"use client"

import { useMemo, useState } from "react"
import {
  Plus,
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ListTree,
  Upload,
  Settings2,
} from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SearchInput } from "@/components/common/SearchInput"
import { DataTable, type DataTableColumn } from "@/components/common/DataTable"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/common/StatusBadge"
import { PageHeader } from "@/components/common/PageHeader"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { RouteGate } from "@/components/auth/RouteGate"
import { PERMISSIONS } from "@/lib/permissions"
import { toast } from "sonner"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { useProductAttributeTemplates } from "@/features/product-attribute-templates/hooks/use-product-attribute-templates"
import { useUpdateProductAttributeTemplateStatus } from "@/features/product-attribute-templates/hooks/use-update-product-attribute-template-status"
import { ProductAttributeTemplateFormDialog } from "@/features/product-attribute-templates/components/ProductAttributeTemplateFormDialog"
import { ProductAttributeOptionsDialog } from "@/features/product-attribute-templates/components/ProductAttributeOptionsDialog"
import { ProductAttributeTemplateImportDialog } from "@/features/product-attribute-templates/components/ProductAttributeTemplateImportDialog"
import type { ProductAttributeTemplateResponse } from "@/features/product-attribute-templates/api/product-attribute-template.types"
import { useProductFieldTemplate } from "@/features/product-field-template/hooks/use-product-field-template"
import { useUpdateProductFieldTemplate } from "@/features/product-field-template/hooks/use-update-product-field-template"
import type { UpdateProductFieldTemplateField } from "@/features/product-field-template/api/product-field-template.types"

export default function ProductAttributesPage() {
  return (
    <RouteGate permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW}>
      <ProductAttributesContent />
    </RouteGate>
  )
}

function ProductAttributesContent() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Product Attributes"
        description="Manage product attribute templates and the product field template"
      />
      <Tabs defaultValue="templates" className="flex flex-1 flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="templates">Attribute Templates</TabsTrigger>
          <TabsTrigger value="fields">Field Template</TabsTrigger>
        </TabsList>
        <TabsContent value="templates">
          <AttributeTemplatesTab />
        </TabsContent>
        <TabsContent value="fields">
          <FieldTemplateTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AttributeTemplatesTab() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [optionsTemplate, setOptionsTemplate] =
    useState<ProductAttributeTemplateResponse | null>(null)
  const [statusToggle, setStatusToggle] =
    useState<ProductAttributeTemplateResponse | null>(null)

  const { data, isLoading, error, refetch } = useProductAttributeTemplates(
    companyUuid,
    {
      search: search || undefined,
      page,
      size,
    }
  )

  const updateStatusMutation =
    useUpdateProductAttributeTemplateStatus(companyUuid)

  const templates = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const columns = useMemo<DataTableColumn<ProductAttributeTemplateResponse>[]>(
    () => [
      {
        id: "label",
        header: "Label",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.label}</span>
        ),
      },
      {
        id: "key",
        header: "Key",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.attributeKey}</span>
        ),
      },
      {
        id: "productType",
        header: "Product Type",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.productType}</Badge>
        ),
      },
      {
        id: "dataType",
        header: "Data Type",
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.dataType}</Badge>
        ),
      },
      {
        id: "slot",
        header: "Slot",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.slotAssignment}</span>
        ),
      },
      {
        id: "mandatory",
        header: "Mandatory",
        cell: ({ row }) => (row.original.mandatory ? "Yes" : "No"),
      },
      {
        id: "order",
        header: "Order",
        cell: ({ row }) => row.original.displayOrder,
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
          const t = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger className="cursor-pointer">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-auto min-w-40"
              >
                <PermissionGate
                  permission={
                    PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE
                  }
                >
                  <DropdownMenuItem
                    onClick={() => setEditingUuid(t.templateUuid)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                {t.dataType === "DROPDOWN" && (
                  <PermissionGate
                    permission={
                      PERMISSIONS.PRODUCT.SUPPORTING_MASTER_VIEW
                    }
                  >
                    <DropdownMenuItem
                      onClick={() => setOptionsTemplate(t)}
                    >
                      <Settings2 className="mr-2 size-4" /> Manage
                      Options
                    </DropdownMenuItem>
                  </PermissionGate>
                )}
                <DropdownMenuSeparator />
                <PermissionGate
                  permission={
                    PERMISSIONS.PRODUCT.SUPPORTING_MASTER_STATUS
                  }
                >
                  <DropdownMenuItem
                    variant={
                      t.status === "ACTIVE"
                        ? "destructive"
                        : "default"
                    }
                    onClick={() => setStatusToggle(t)}
                  >
                    {t.status === "ACTIVE" ? (
                      <>
                        <ToggleLeft className="mr-2 size-4" />{" "}
                        Deactivate
                      </>
                    ) : (
                      <>
                        <ToggleRight className="mr-2 size-4" />{" "}
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    []
  )

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <SearchInput
          placeholder="Search attribute templates..."
          defaultValue={search}
          onChange={(v) => {
            setSearch(v)
            setPage(0)
          }}
        />
        <div className="ml-auto flex items-center gap-2">
          <PermissionGate
            permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_IMPORT}
          >
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 size-4" />
              Import
            </Button>
          </PermissionGate>
          <PermissionGate
            permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_CREATE}
          >
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" /> Create Template
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={templates}
        getRowId={(t) => t.templateUuid}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: ListTree,
          title: "No attribute templates found",
          description: search
            ? "Try a different search."
            : "Create an attribute template to get started.",
        }}
        pagination={{ page, totalPages, onPageChange: setPage, pageSize: size, onPageSizeChange: (s) => { setSize(s); setPage(0) } }}
      />

      <ProductAttributeTemplateFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyUuid={companyUuid}
      />
      <ProductAttributeTemplateFormDialog
        open={!!editingUuid}
        onOpenChange={(open) => !open && setEditingUuid(null)}
        companyUuid={companyUuid}
        attributeTemplateUuid={editingUuid}
      />

      <ProductAttributeOptionsDialog
        open={!!optionsTemplate}
        onOpenChange={(open) => !open && setOptionsTemplate(null)}
        companyUuid={companyUuid}
        attributeTemplateUuid={optionsTemplate?.templateUuid ?? null}
        templateLabel={optionsTemplate?.label}
      />

      <ProductAttributeTemplateImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        companyUuid={companyUuid}
        onImportComplete={() => refetch()}
      />

      <ConfirmDialog
        open={!!statusToggle}
        onOpenChange={(open) => !open && setStatusToggle(null)}
        title="Update Status?"
        description="This will change the attribute template status."
        confirmLabel="Confirm"
        variant="destructive"
        isLoading={updateStatusMutation.isPending}
        onConfirm={() => {
          if (!statusToggle) return
          updateStatusMutation.mutate(
            {
              attributeTemplateUuid: statusToggle.templateUuid,
              input: {
                status:
                  statusToggle.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                version: statusToggle.version,
              },
            },
            {
              onSuccess: () => {
                toast.success("Status updated")
                setStatusToggle(null)
              },
              onError: (err) =>
                toast.error(getApiErrorMessage(err, "Failed")),
            }
          )
        }}
      />
    </div>
  )
}

function FieldTemplateTab() {
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const { data, isLoading, error, refetch } =
    useProductFieldTemplate(companyUuid)
  const updateMutation = useUpdateProductFieldTemplate(companyUuid)

  const fields = useMemo(() => data?.fields ?? [], [data])

  // Editable draft keyed by server data: re-initialized whenever the fetched
  // template changes (key remount), edits stay local until Save.
  const [rows, setRows] = useState<UpdateProductFieldTemplateField[] | null>(
    null
  )
  const draft =
    rows ??
    fields.map((f) => ({
      fieldKey: f.fieldKey,
      visible: f.visible,
      mandatory: f.mandatory,
      displayOrder: f.displayOrder,
    }))

  const dirty =
    rows !== null &&
    rows.length === fields.length &&
    rows.some((r, i) => {
      const f = fields[i]
      return (
        r.visible !== f.visible ||
        r.mandatory !== f.mandatory ||
        r.displayOrder !== f.displayOrder
      )
    })

  const updateRow = (
    fieldKey: string,
    patch: Partial<UpdateProductFieldTemplateField>
  ) => {
    setRows(draft.map((r) => (r.fieldKey === fieldKey ? { ...r, ...patch } : r)))
  }

  const applicabilityOf = (fieldKey: string) =>
    fields.find((f) => f.fieldKey === fieldKey)?.applicability ?? "-"

  const columns = useMemo<DataTableColumn<UpdateProductFieldTemplateField>[]>(
    () => [
      {
        id: "fieldKey",
        header: "Field Key",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.fieldKey}</span>
        ),
      },
      {
        id: "applicability",
        header: "Applicability",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {applicabilityOf(row.original.fieldKey)}
          </Badge>
        ),
      },
      {
        id: "visible",
        header: "Visible",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate
              permission={
                PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE
              }
            >
              {(allowed) => (
                <Checkbox
                  checked={r.visible}
                  disabled={!allowed}
                  onCheckedChange={(checked) =>
                    updateRow(r.fieldKey, {
                      visible: checked === true,
                    })
                  }
                />
              )}
            </PermissionGate>
          )
        },
      },
      {
        id: "mandatory",
        header: "Mandatory",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate
              permission={
                PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE
              }
            >
              {(allowed) => (
                <Checkbox
                  checked={r.mandatory}
                  disabled={!allowed}
                  onCheckedChange={(checked) =>
                    updateRow(r.fieldKey, {
                      mandatory: checked === true,
                    })
                  }
                />
              )}
            </PermissionGate>
          )
        },
      },
      {
        id: "displayOrder",
        header: "Display Order",
        cell: ({ row }) => {
          const r = row.original
          return (
            <PermissionGate
              permission={
                PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE
              }
            >
              {(allowed) => (
                <Input
                  type="number"
                  min={0}
                  value={r.displayOrder}
                  disabled={!allowed}
                  onChange={(e) =>
                    updateRow(r.fieldKey, {
                      displayOrder: Number(e.target.value),
                    })
                  }
                />
              )}
            </PermissionGate>
          )
        },
      },
    ],
    // `updateRow` / `applicabilityOf` close over the current draft + fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draft, fields]
  )

  const handleSave = () => {
    updateMutation.mutate(
      { fields: draft },
      {
        onSuccess: () => {
          toast.success("Field template updated")
          setRows(null)
        },
        onError: (err) => toast.error(getApiErrorMessage(err, "Failed")),
      }
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Control which product fields are visible and mandatory, and their
          display order.
        </p>
        <div className="ml-auto">
          <PermissionGate
            permission={PERMISSIONS.PRODUCT.SUPPORTING_MASTER_UPDATE}
          >
            <Button
              disabled={!dirty || updateMutation.isPending}
              onClick={handleSave}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </PermissionGate>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={draft}
        getRowId={(r) => r.fieldKey}
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        empty={{
          icon: Settings2,
          title: "No fields found",
          description: "The field template has no fields.",
        }}
      />
    </div>
  )
}
