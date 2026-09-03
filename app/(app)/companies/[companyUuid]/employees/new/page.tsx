"use client"

import { useParams, useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { PageHeader } from "@/components/common/PageHeader"
import { useCreateEmployee } from "@/features/employees/hooks/use-create-employee"
import { getApiErrorMessage } from "@/lib/api/api-error"
import { DesignationCombobox } from "@/features/designations/components/DesignationCombobox"

const employeeSchema = z.object({
  employeeCode: z.string().min(1, "Code is required").max(50),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  designationUuid: z.string().optional(),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

export default function NewEmployeePage() {
  const params = useParams<{ companyUuid: string }>()
  const router = useRouter()
  const companyUuid = params.companyUuid
  const createMutation = useCreateEmployee(companyUuid)

  const { register, handleSubmit, control, formState: { errors } } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { employeeCode: "", firstName: "", lastName: "", email: "", phone: "", designationUuid: undefined },
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Create Employee" description="Add a new employee" />
      <form
        className="max-w-lg space-y-6"
        onSubmit={handleSubmit((values) => {
          const payload = {
            ...values,
            designationUuid: values.designationUuid || undefined,
          }
          createMutation.mutate(payload, {
            onSuccess: () => { toast.success("Employee created"); router.push(`/companies/${companyUuid}/employees`) },
            onError: (error) => { toast.error(getApiErrorMessage(error, "Failed to create employee")) },
          })
        })}
      >
        <div className="rounded-lg border p-6 space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Employee Code</FieldLabel>
              <Input placeholder="e.g. EMP001" aria-invalid={!!errors.employeeCode} {...register("employeeCode")} />
              <FieldError errors={[errors.employeeCode]} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input placeholder="First name" aria-invalid={!!errors.firstName} {...register("firstName")} />
                <FieldError errors={[errors.firstName]} />
              </Field>
              <Field>
                <FieldLabel>Last Name</FieldLabel>
                <Input placeholder="Last name" aria-invalid={!!errors.lastName} {...register("lastName")} />
                <FieldError errors={[errors.lastName]} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" placeholder="e.g. emp@company.com" aria-invalid={!!errors.email} {...register("email")} />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel>Phone</FieldLabel>
              <Input placeholder="Phone number (optional)" {...register("phone")} />
            </Field>
            <Field>
              <FieldLabel>Designation</FieldLabel>
              <Controller
                control={control}
                name="designationUuid"
                render={({ field }) => (
                  <DesignationCombobox
                    companyUuid={companyUuid}
                    value={field.value ?? null}
                    onValueChange={(v) => field.onChange(v ?? undefined)}
                    placeholder="Search designation..."
                  />
                )}
              />
              <FieldError errors={[errors.designationUuid]} />
            </Field>
          </FieldGroup>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Employee"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
