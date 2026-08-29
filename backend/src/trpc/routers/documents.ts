import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import { prisma } from '../../db'
import { TRPCError } from '@trpc/server'

// ─── Validation Schemas ────────────────────────────────────────────────────

const docTypeSchema = z.enum([
  'CONTRACT',
  'BRIEF',
  'MOTION',
  'MEMORANDUM',
  'PLEADING',
  'AGREEMENT',
  'LETTER',
  'OTHER',
])

const docStatusSchema = z.enum(['draft', 'review', 'approved', 'archived'])

const courtSchema = z.enum([
  'FEDERAL',
  'APPEAL',
  'HIGH',
  'SESSIONS',
  'MAGISTRATE',
])

const partiesSchema = z
  .object({
    plaintiff: z.string().optional(),
    defendant: z.string().optional(),
    petitioner: z.string().optional(),
    respondent: z.string().optional(),
    appellant: z.string().optional(),
    appellee: z.string().optional(),
  })
  .optional()

const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  content: z.string().min(1, 'Content is required'),
  docType: docTypeSchema,
  status: docStatusSchema.default('draft'),
  clientId: z.string().optional(),
  caseNumber: z.string().optional(),
  court: courtSchema.optional(),
  jurisdiction: z.string().optional(),
  tags: z.array(z.string()).default([]),
  parties: partiesSchema,
  fileUrl: z.string().url().optional(),
  fileSize: z.number().int().positive().optional(),
  mimeType: z.string().optional(),
  createdBy: z.string().optional(),
})

const updateDocumentSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  docType: docTypeSchema.optional(),
  status: docStatusSchema.optional(),
  clientId: z.string().nullable().optional(),
  caseNumber: z.string().nullable().optional(),
  court: courtSchema.nullable().optional(),
  jurisdiction: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  parties: partiesSchema,
  fileUrl: z.string().url().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  updatedBy: z.string().optional(),
})

const listDocumentsSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  docType: docTypeSchema.optional(),
  status: docStatusSchema.optional(),
  clientId: z.string().optional(),
  caseNumber: z.string().optional(),
  court: courtSchema.optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ─── Router ────────────────────────────────────────────────────────────────

export const documentsRouter = router({
  /**
   * Create a new legal document
   */
  create: publicProcedure.input(createDocumentSchema).mutation(async ({ input, ctx }) => {
    const document = await prisma.legalDocument.create({
      data: {
        title: input.title,
        content: input.content,
        docType: input.docType,
        status: input.status,
        clientId: input.clientId,
        caseNumber: input.caseNumber,
        court: input.court,
        jurisdiction: input.jurisdiction,
        tags: input.tags,
        parties: input.parties ?? null,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
        mimeType: input.mimeType ?? 'text/markdown',
        createdBy: input.createdBy,
      },
    })

    return document
  }),

  /**
   * Get a single document by ID
   */
  getById: publicProcedure.input(z.string().cuid()).query(async ({ input: id }) => {
    const document = await prisma.legalDocument.findUnique({
      where: { id },
    })

    if (!document) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found`,
      })
    }

    return document
  }),

  /**
   * List documents with filtering, pagination, and search
   */
  list: publicProcedure.input(listDocumentsSchema).query(async ({ input }) => {
    const { cursor, limit, sortBy, sortOrder, search, tags, ...filters } = input

    // Build where clause
    const where: Record<string, unknown> = {}

    // Apply filters
    if (filters.docType) where.docType = filters.docType
    if (filters.status) where.status = filters.status
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.caseNumber) where.caseNumber = filters.caseNumber
    if (filters.court) where.court = filters.court

    // Tag filtering (documents must have ALL specified tags)
    if (tags && tags.length > 0) {
      where.tags = { hasEvery: tags }
    }

    // Full-text search on title and content
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Fetch documents with cursor-based pagination
    const documents = await prisma.legalDocument.findMany({
      where,
      take: limit + 1, // Fetch one extra to determine if there's a next page
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        title: true,
        docType: true,
        status: true,
        clientId: true,
        caseNumber: true,
        court: true,
        tags: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    })

    // Determine if there's a next page
    let nextCursor: string | undefined
    if (documents.length > limit) {
      const nextItem = documents.pop()
      nextCursor = nextItem?.id
    }

    return {
      documents,
      nextCursor,
      hasMore: !!nextCursor,
    }
  }),

  /**
   * Update an existing document
   */
  update: publicProcedure.input(updateDocumentSchema).mutation(async ({ input }) => {
    const { id, ...data } = input

    // Check if document exists
    const existing = await prisma.legalDocument.findUnique({
      where: { id },
      select: { id: true, version: true },
    })

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found`,
      })
    }

    // Build update data, handling nullable fields
    const updateData: Record<string, unknown> = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.docType !== undefined) updateData.docType = data.docType
    if (data.status !== undefined) updateData.status = data.status
    if (data.clientId !== undefined) updateData.clientId = data.clientId
    if (data.caseNumber !== undefined) updateData.caseNumber = data.caseNumber
    if (data.court !== undefined) updateData.court = data.court
    if (data.jurisdiction !== undefined) updateData.jurisdiction = data.jurisdiction
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.parties !== undefined) updateData.parties = data.parties ?? null
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy

    // Increment version on content changes
    if (data.content !== undefined) {
      updateData.version = existing.version + 1
    }

    const document = await prisma.legalDocument.update({
      where: { id },
      data: updateData,
    })

    return document
  }),

  /**
   * Delete a document
   */
  delete: publicProcedure.input(z.string().cuid()).mutation(async ({ input: id }) => {
    // Check if document exists
    const existing = await prisma.legalDocument.findUnique({
      where: { id },
      select: { id: true, status: true },
    })

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found`,
      })
    }

    // Prevent deletion of approved documents (soft-delete by archiving instead)
    if (existing.status === 'approved') {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Cannot delete approved documents. Archive them instead.',
      })
    }

    await prisma.legalDocument.delete({
      where: { id },
    })

    return { success: true, id }
  }),

  /**
   * Archive a document (soft delete)
   */
  archive: publicProcedure.input(z.string().cuid()).mutation(async ({ input: id }) => {
    const existing = await prisma.legalDocument.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existing) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found`,
      })
    }

    const document = await prisma.legalDocument.update({
      where: { id },
      data: { status: 'archived' },
    })

    return document
  }),

  /**
   * Submit document for review
   */
  submitForReview: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reviewerId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.legalDocument.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with ID '${input.id}' not found`,
        })
      }

      if (existing.status !== 'draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Only draft documents can be submitted for review',
        })
      }

      const document = await prisma.legalDocument.update({
        where: { id: input.id },
        data: {
          status: 'review',
          reviewedBy: input.reviewerId,
        },
      })

      return document
    }),

  /**
   * Approve a document
   */
  approve: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reviewerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.legalDocument.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with ID '${input.id}' not found`,
        })
      }

      if (existing.status !== 'review') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Only documents under review can be approved',
        })
      }

      const document = await prisma.legalDocument.update({
        where: { id: input.id },
        data: {
          status: 'approved',
          reviewedBy: input.reviewerId,
          reviewedAt: new Date(),
        },
      })

      return document
    }),

  /**
   * Duplicate a document
   */
  duplicate: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        newTitle: z.string().min(1).max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const original = await prisma.legalDocument.findUnique({
        where: { id: input.id },
      })

      if (!original) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Document with ID '${input.id}' not found`,
        })
      }

      const duplicate = await prisma.legalDocument.create({
        data: {
          title: input.newTitle ?? `${original.title} (Copy)`,
          content: original.content,
          docType: original.docType,
          status: 'draft', // Always start as draft
          version: 1,
          clientId: original.clientId,
          caseNumber: original.caseNumber,
          court: original.court,
          jurisdiction: original.jurisdiction,
          tags: original.tags,
          parties: original.parties,
          mimeType: original.mimeType,
          // Don't copy file references, createdBy, reviewedBy, etc.
        },
      })

      return duplicate
    }),

  /**
   * Get document statistics
   */
  stats: publicProcedure
    .input(
      z
        .object({
          clientId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const where = input?.clientId ? { clientId: input.clientId } : {}

      const [total, byStatus, byType, recentActivity] = await Promise.all([
        // Total count
        prisma.legalDocument.count({ where }),

        // Count by status
        prisma.legalDocument.groupBy({
          by: ['status'],
          where,
          _count: { id: true },
        }),

        // Count by document type
        prisma.legalDocument.groupBy({
          by: ['docType'],
          where,
          _count: { id: true },
        }),

        // Recent activity (last 30 days)
        prisma.legalDocument.count({
          where: {
            ...where,
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ])

      return {
        total,
        byStatus: Object.fromEntries(byStatus.map((s: any) => [s.status, s._count.id])),
        byType: Object.fromEntries(byType.map((t: any) => [t.docType, t._count.id])),
        recentActivity,
      }
    }),
})

// ─── Type Exports ──────────────────────────────────────────────────────────

export type DocumentsRouter = typeof documentsRouter
