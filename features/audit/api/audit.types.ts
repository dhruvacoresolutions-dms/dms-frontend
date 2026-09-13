export type AuditEventResponse = {
  publicId: string
  eventType: string
  targetType: string
  targetPublicId: string
  correlationId: string
  createdAt: string
}

export type AuditListParams = {
  search?: string
  page?: number
  size?: number
}
