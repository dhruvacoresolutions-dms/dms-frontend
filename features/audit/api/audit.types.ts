export type AuditEventResponse = {
  publicId: string
  eventType: string
  targetType: string
  targetPublicId: string
  correlationId: string
  createdAt: string
}

export type AuditListParams = {
  page?: number
  size?: number
}
