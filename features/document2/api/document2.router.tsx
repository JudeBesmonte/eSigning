import type { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"

import { createTRPCRouter, protectedProcedure } from "@/services/trpc/init"

import {
  deleteDocumentsSchema,
  getDocumentByIdSchema,
  getDocumentsSchema,
  getDocumentForViewingSchema,
  type DocumentsResponse,
  type DocumentWithRelations
} from "./document2.schema"

// Document include type for getting document with relations

export const document2Router = createTRPCRouter({
  // Get paginated list of documents with envelope information
  getAll: protectedProcedure
    .input(getDocumentsSchema)
    .query(async ({ ctx, input }) => {
      try {
        const { db } = ctx
        const {
          page = 1,
          limit = 10,
          sortBy = "createdAt",
          sortOrder = "desc"
        } = input

        // Build where clause based on input
        const where: Prisma.DocumentWhereInput = {}

        const [documents, total] = await Promise.all([
          db.document.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
              envelope: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  createdBy: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              },
              recipients: {
                select: {
                  id: true,
                  status: true,
                  role: true,
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              },
              signedDoc: {
                select: {
                  id: true,
                  name: true,
                  path: true
                }
              }
            }
          }),
          db.document.count({ where })
        ])

        return {
          data: documents as unknown as DocumentWithRelations[],
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        } as DocumentsResponse
      } catch (error) {
        console.error("Error fetching documents:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch documents"
        })
      }
    }),

  // Get a single document by ID
  getById: protectedProcedure
    .input(getDocumentByIdSchema)
    .query(async ({ ctx, input }): Promise<DocumentWithRelations> => {
      const document = (await ctx.db.document.findUnique({
        where: { id: input.id },
        include: {
          messages: {
            include: {
              sender: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      })) as unknown as DocumentWithRelations | null

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found"
        })
      }

      // Check if user has permission to view this document
      if (document.createdById !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this document"
        })
      }

      return document as unknown as DocumentWithRelations
    }),

  // Get document for viewing with signed version if available
  getDocumentForViewing: protectedProcedure
    .input(getDocumentForViewingSchema)
    .query(async ({ ctx, input }) => {
      const { documentId, preferSigned } = input
      const { db, session } = ctx

      // Get the document with signed version
      const document = await db.document.findUnique({
        where: { id: documentId },
        include: {
          signedDoc: true,
          envelope: {
            select: {
              id: true,
              title: true,
              status: true,
              userId: true,
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          recipients: {
            select: {
              id: true,
              status: true,
              role: true,
              userId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found"
        })
      }

      // Check if user has permission to view this document
      const isOwner = document.envelope?.userId === session.user.id
      const isRecipient = document.recipients.some(r => r.userId === session.user.id)

      if (!isOwner && !isRecipient) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this document"
        })
      }

      // Determine which document version to show
      const displayDocument = (preferSigned && document.signedDoc) ? document.signedDoc : document

      // Generate public URL using Supabase
      const supabase = (await import("@/services/supabase")).getSupabaseClient()

      // Determine bucket based on path
      const getBucketName = (path: string): string => {
        if (path.includes("envelopes/")) return "envelopes"
        if (path.includes("documents/")) return "documents"
        return "documents" // default
      }

      const bucketName = getBucketName(displayDocument.path)
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(displayDocument.path)

      return {
        id: displayDocument.id,
        name: displayDocument.name,
        fileUrl: data.publicUrl,
        isSignedVersion: preferSigned && !!document.signedDoc
      }
    }),

  // Delete multiple documents
  deleteMany: protectedProcedure
    .input(deleteDocumentsSchema)
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      // First, verify the user has permission to delete these documents
      // We need to check through the envelope's createdBy since documents are owned by envelopes
      const envelopes = await db.envelope.findMany({
        where: {
          documents: {
            some: {
              id: { in: input.ids }
            }
          },
          userId: session.user.id // Only allow deleting documents in envelopes created by the user
        },
        select: { id: true }
      })

      if (envelopes.length === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete these documents"
        })
      }

      // Delete the documents
      await db.document.deleteMany({
        where: { id: { in: input.ids } }
      })

      return { success: true, count: input.ids.length }
    })
})
