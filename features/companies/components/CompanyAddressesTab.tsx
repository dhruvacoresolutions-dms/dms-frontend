"use client"

import { useState } from "react"
import { Plus, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { LoadingState } from "@/components/common/LoadingState"
import { EmptyState } from "@/components/common/EmptyState"
import { ErrorState } from "@/components/common/ErrorState"
import {
  useCompanyAddresses,
  useAddCompanyAddress,
} from "@/features/companies/hooks/use-company-addresses"
import { getApiErrorMessage } from "@/lib/api/api-error"

const addressSchema = z.object({
  addressType: z.string().min(1, "Address type is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z
    .string()
    .length(2, "Country code must be exactly 2 characters"),
  primary: z.boolean(),
})

type AddressFormValues = z.infer<typeof addressSchema>

export function CompanyAddressesTab({ companyUuid }: { companyUuid: string }) {
  const [open, setOpen] = useState(false)
  const { data: addresses, isLoading, error, refetch } =
    useCompanyAddresses(companyUuid)
  const addAddressMutation = useAddCompanyAddress(companyUuid)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: "REGISTERED",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      countryCode: "IN",
      primary: false,
    },
  })

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Addresses</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 size-4" />
            Add Address
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Address</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit((values) =>
                addAddressMutation.mutate(values, {
                  onSuccess: () => {
                    toast.success("Address added successfully")
                    reset()
                    setOpen(false)
                  },
                  onError: (error) => {
                    toast.error(
                      getApiErrorMessage(error, "Failed to add address")
                    )
                  },
                })
              )}
              className="space-y-4"
            >
              <FieldGroup>
                <Field>
                  <FieldLabel>Address Type</FieldLabel>
                  <Select
                    value={watch("addressType")}
                    onValueChange={(v) => {
                      if (v) setValue("addressType", v, { shouldValidate: true })
                    }}
                  >
                    <SelectTrigger aria-invalid={!!errors.addressType}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REGISTERED">Registered</SelectItem>
                      <SelectItem value="CORPORATE">Corporate</SelectItem>
                      <SelectItem value="BRANCH">Branch</SelectItem>
                      <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[errors.addressType]} />
                </Field>
                <Field>
                  <FieldLabel>Address Line 1</FieldLabel>
                  <Input
                    placeholder="Street address"
                    aria-invalid={!!errors.line1}
                    {...register("line1")}
                  />
                  <FieldError errors={[errors.line1]} />
                </Field>
                <Field>
                  <FieldLabel>Address Line 2</FieldLabel>
                  <Input
                    placeholder="Apt, suite, etc. (optional)"
                    {...register("line2")}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>City</FieldLabel>
                    <Input
                      placeholder="City"
                      aria-invalid={!!errors.city}
                      {...register("city")}
                    />
                    <FieldError errors={[errors.city]} />
                  </Field>
                  <Field>
                    <FieldLabel>State</FieldLabel>
                    <Input
                      placeholder="State (optional)"
                      {...register("state")}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Postal Code</FieldLabel>
                    <Input
                      placeholder="Postal code (optional)"
                      {...register("postalCode")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Country Code</FieldLabel>
                    <Input
                      placeholder="e.g. IN"
                      maxLength={2}
                      aria-invalid={!!errors.countryCode}
                      {...register("countryCode")}
                    />
                    <FieldError errors={[errors.countryCode]} />
                  </Field>
                </div>
                <Field>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isPrimary"
                      checked={watch("primary")}
                      onCheckedChange={(checked) =>
                        setValue("primary", !!checked)
                      }
                    />
                    <label htmlFor="isPrimary" className="text-sm">
                      Primary address
                    </label>
                  </div>
                </Field>
              </FieldGroup>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addAddressMutation.isPending}>
                  {addAddressMutation.isPending ? "Adding..." : "Add Address"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!addresses || addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No addresses"
          description="No addresses have been added yet."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <div key={address.addressUuid} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium">{address.addressLine1}</p>
                {address.isPrimary && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
              {address.addressLine2 && (
                <p className="text-sm text-muted-foreground">
                  {address.addressLine2}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {[address.city, address.state, address.postalCode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">
                {address.countryCode}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
