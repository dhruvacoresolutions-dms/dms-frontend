"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeader } from "@/components/common/PageHeader"
import { LoadingState } from "@/components/common/LoadingState"
import { usePermissionSet } from "@/features/permission-sets/hooks/use-permission-set"
import { useUpdatePermissionSet } from "@/features/permission-sets/hooks/use-update-permission-set"
import { getApiErrorMessage } from "@/lib/api/api-error"

const editSchema = z.object({
  code: z.string().min(2).max(80).regex(/^[A-Z0-9_]+$/, "Must be uppercase, numbers, or underscores"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type EditValues = z.infer<typeof editSchema>

export default function EditPermissionSetPage() {
  const params = useParams<{ companyUuid: string; setUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const setUuid = params.setUuid
  const { data: ps, isLoading } = usePermissionSet(companyUuid, setUuid)
  const updateMutation = useUpdatePermissionSet(companyUuid, setUuid)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { code: "", name: "", description: "" },
  })

  useEffect(() => {
    if (ps) reset({ code: ps.code, name: ps.name, description: ps.description ?? "" })
  }, [ps, reset])

  if (isLoading) return <LoadingState />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit Permission Set" description={`Editing ${ps?.name}`} />
      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) =>
          updateMutation.mutate(values, {
            onSuccess: () => { toast.success("Permission set updated"); router.push(`/companies/${companyUuid}/permission-sets/${setUuid}`) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
          })
        )}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Code</FieldLabel>
              <Input aria-invalid={!!errors.code} {...register("code")} />
              <FieldError errors={[errors.code]} />
            </Field>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input aria-invalid={!!errors.name} {...register("name")} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Input {...register("description")} />
            </Field>
          </FieldGroup>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save Changes"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
