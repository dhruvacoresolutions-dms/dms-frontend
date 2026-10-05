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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { TableSkeleton } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
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
      size: 20,
    }
  )

  const updateStatusMutation =
    useUpdateProductAttributeTemplateStatus(companyUuid)

  const templates = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

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

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : templates.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title="No attribute templates found"
          description={
            search
              ? "Try a different search."
              : "Create an attribute template to get started."
          }
        />
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Mandatory</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.templateUuid}>
                    <TableCell className="font-medium">{t.label}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {t.attributeKey}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.productType}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.dataType}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {t.slotAssignment}
                    </TableCell>
                    <TableCell>{t.mandatory ? "Yes" : "No"}</TableCell>
                    <TableCell>{t.displayOrder}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

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

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : draft.length === 0 ? (
        <EmptyState
          icon={Settings2}
          title="No fields found"
          description="The field template has no fields."
        />
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Key</TableHead>
                <TableHead>Applicability</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead className="w-32">Display Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.map((r) => (
                <TableRow key={r.fieldKey}>
                  <TableCell className="font-mono text-sm">
                    {r.fieldKey}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {applicabilityOf(r.fieldKey)}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
