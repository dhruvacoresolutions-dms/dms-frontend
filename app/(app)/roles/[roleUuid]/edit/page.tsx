"use client"

import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
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
import { useRole } from "@/features/roles/hooks/use-role"
import { useUpdateRole } from "@/features/roles/hooks/use-update-role"
import { getApiErrorMessage } from "@/lib/api/api-error"

const editSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
})

type EditValues = z.infer<typeof editSchema>

export default function EditRolePage() {
  const params = useParams<{ roleUuid: string }>()
  const router = useRouter()
  const companyUuid = useAuthStore((s) => s.session?.user?.companyUuid) ?? "current"
  const roleUuid = params.roleUuid
  const { data: role, isLoading } = useRole(companyUuid, roleUuid)
  const updateMutation = useUpdateRole(companyUuid, roleUuid)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (role) reset({ name: role.name, description: role.description ?? "" })
  }, [role, reset])

  if (isLoading) return <LoadingState />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit Role" description={`Editing ${role?.name}`} />
      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) =>
          updateMutation.mutate(
            { ...values, status: role?.status ?? "ACTIVE" },
            {
              onSuccess: () => { toast.success("Role updated"); router.push(`/roles/${roleUuid}`) },
              onError: (error) => { toast.error(getApiErrorMessage(error, "Failed")) },
            }
          )
        )}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
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
