import { z } from "zod"

// Define enums to avoid direct Prisma client dependency
export const DocumentStatus = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
  REJECTED: "REJECTED"
} as const

export type DocumentStatus =
  (typeof DocumentStatus)[keyof typeof DocumentStatus]

export const DocumentType = {
  CONTRACT: "CONTRACT",
  AGREEMENT: "AGREEMENT",
  PROPOSAL: "PROPOSAL",
  INVOICE: "INVOICE",
  OTHER: "OTHER"
} as const

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType]

export const getDocumentsSchema = z.object({
  status: z.nativeEnum(DocumentStatus).optional(),
  type: z.nativeEnum(DocumentType).optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc")
})

export const getDocumentByIdSchema = z.object({
  id: z.string()
})

export const getDocumentForViewingSchema = z.object({
  documentId: z.string(),
  preferSigned: z.boolean().optional().default(false)
})

export const deleteDocumentsSchema = z.object({
  ids: z.array(z.string())
})

export type GetDocumentsInput = z.infer<typeof getDocumentsSchema>
export type GetDocumentByIdInput = z.infer<typeof getDocumentByIdSchema>
export type GetDocumentForViewingInput = z.infer<typeof getDocumentForViewingSchema>
export type DeleteDocumentsInput = z.infer<typeof deleteDocumentsSchema>

export type DocumentWithRelations = {
  id: string
  name: string
  description: string | null
  status: DocumentStatus
  type: DocumentType
  fileUrl: string | null
  fileKey: string | null
  path: string | null
  size: number | null
  mimeType: string | null
  metadata: Record<string, unknown> | null
  createdAt: Date
  updatedAt: Date
  createdById: string
  updatedById: string | null
  envelopeId: string | null
  createdBy: {
    id: string
    name: string | null
    email: string | null
  }
  updatedBy: {
    id: string
    name: string | null
    email: string | null
  } | null
  envelope?: {
    id: string
    title: string
    status: string
    createdBy: {
      id: string
      name: string | null
      email: string | null
    }
  } | null
  recipients?: {
    id: string
    status: string
    role: string
    user: {
      id: string
      name: string | null
      email: string | null
    } | null
  }[]
  signedDoc?: {
    id: string
    name: string
    path: string | null
  } | null
}

export type DocumentsResponse = {
  data: DocumentWithRelations[]
  total: number
  page: number
  limit: number
  totalPages: number
}
