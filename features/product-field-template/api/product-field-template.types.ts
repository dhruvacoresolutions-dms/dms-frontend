export type ProductFieldDefinition = {
  fieldKey: string
  applicability?: string
  visible: boolean
  mandatory: boolean
  displayOrder: number
  version?: number
}

export type ProductFieldTemplateResponse = {
  fields: ProductFieldDefinition[]
}

export type UpdateProductFieldTemplateField = {
  fieldKey: string
  visible: boolean
  mandatory: boolean
  displayOrder: number
}

export type UpdateProductFieldTemplateRequest = {
  fields: UpdateProductFieldTemplateField[]
}
