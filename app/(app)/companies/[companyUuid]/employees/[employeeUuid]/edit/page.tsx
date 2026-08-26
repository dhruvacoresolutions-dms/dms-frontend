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
import { useEmployee } from "@/features/employees/hooks/use-employee"
import { useUpdateEmployee } from "@/features/employees/hooks/use-update-employee"
import { getApiErrorMessage } from "@/lib/api/api-error"

const editSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
})

type EditValues = z.infer<typeof editSchema>

export default function EditEmployeePage() {
  const params = useParams<{ companyUuid: string; employeeUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const employeeUuid = params.employeeUuid
  const { data: employee, isLoading } = useEmployee(companyUuid, employeeUuid)
  const updateMutation = useUpdateEmployee(companyUuid, employeeUuid)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "" },
  })

  useEffect(() => {
    if (employee) {
      reset({ firstName: employee.firstName, lastName: employee.lastName, email: employee.email ?? "", phone: employee.mobile ?? "" })
    }
  }, [employee, reset])

  if (isLoading) return <LoadingState />

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Edit Employee" description={`Editing ${employee?.firstName} ${employee?.lastName}`} />
      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) =>
          updateMutation.mutate(values, {
            onSuccess: () => { toast.success("Employee updated"); router.push(`/companies/${companyUuid}/employees/${employeeUuid}`) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed to update employee")) },
          })
        )}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input aria-invalid={!!errors.firstName} {...register("firstName")} />
                <FieldError errors={[errors.firstName]} />
              </Field>
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input aria-invalid={!!errors.lastName} {...register("lastName")} />
                <FieldError errors={[errors.lastName]} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" aria-invalid={!!errors.email} {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input {...register("phone")} />
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
