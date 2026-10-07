import { z } from 'zod';
import { router, protectedProcedure, permissionProcedure } from '../trpc';
import { prisma } from '../../db';
import { queues } from '../../queues/index';

const contractTypeSchema = z.enum([
  'NDA', 'SERVICE', 'EMPLOYMENT', 'LEASE', 'SALE', 'LOAN', 'PARTNERSHIP', 'OTHER'
]);
const contractStatusSchema = z.enum([
  'draft', 'review', 'negotiation', 'executed', 'expired', 'terminated'
]);

export const aiGatewayRouter = router({
  // Health check
  health: protectedProcedure
    .query(() => {
      return {
        status: 'healthy',
        services: [
          'legal_retrieve',
          'legal_analyse',
          'legal_draft',
          'legal_validate',
          'legal_debate',
          'legal_privacy',
          'legal_audit',
          'legal_orchestrate',
          'legal_monitor',
          'legal_index',
          'legal_test',
          'read',
          'write'
        ],
        version: '1.0.0'
      });
    }),

  // Main API endpoints
  listLegalServices: protectedProcedure
    .query(() => ({
      services: [
        { id: 'legal_retrieve', name: 'Legal Retrieval', description: 'Semantic search and retrieval of legal documents' },
        { id: 'legal_analyse', name: 'Legal Analysis', description: 'Automated legal analysis and insights' },
        { id: 'legal_draft', name: 'Document Drafting', description: 'Draft legal documents (summons, affidavits, submissions, etc.)' },
        { id: 'legal_validate', name: 'Citation Validation', description: 'Verify citations and legal references' },
        { id: 'legal_debate', name: 'Legal Debate Simulation', description: 'Multi-agent debate simulation for legal arguments' },
        { id: 'legal_privacy', name: 'Privacy & PII Management', description: 'Redaction and privacy controls' },
        { id: 'legal_audit', name: 'Compliance Auditing', description: 'Audit trails and compliance reporting' },
        { id: 'legal_orchestrate', name: 'Full Workflow Orchestration', description: 'End-to-end legal workflow automation' },
        { id: 'legal_monitor', name: 'Regulatory Monitoring', description: 'Trend detection and regulatory alerts' },
        { id: 'legal_index', name: 'Document Indexing', description: 'Advanced document indexing and search' },
        { id: 'legal_test', name: 'Quality Testing', description: 'Gold evaluation and adversarial testing' }
      ]},
      version: '1.0.0'
    }),

  getServiceDetails: permissionProcedure('read_legal_service')
    .query(() => {
      const services = await prisma.legalService.findMany();
      return services.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        status: s.status,
        lastUsed: s.lastUsed
      }));
    }),

  createLegalService: permissionProcedure('create_legal_service')
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500),
      category: z.enum([
        'retrieval', 'analysis', 'drafting', 'validation', 'debate', 'privacy', 
        'audit', 'orchestrate', 'monitor', 'index', 'test'
      ])
    }))
    .mutation(async ({ input, ctx }) => {
      const service = await prisma.legalService.create({
        data: {
          name: input.name,
          description: input.description,
          category: input.category,
          status: 'draft',
          createdBy: ctx.userId
        }
      });
      return { service, message: 'Legal service created successfully' };
    }),

  updateLegalService: permissionProcedure('update_legal_service')
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.enum([
        'retrieval', 'analysis', 'drafting', 'validation', 'debate', 'privacy', 
        'audit', 'orchestrate', 'monitor', 'index', 'test'
      ])
    }))
    .mutation(async ({ input, ctx }) => {
      const service = await prisma.legalService.update({
        where: { id: input.id },
        data: input
      });
      return { service, message: 'Legal service updated successfully' };
    }),

  deleteLegalService: permissionProcedure('delete_legal_service')
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const service = await prisma.legalService.delete({ where: { id: input.id } });
      return { message: 'Legal service deleted successfully' };
    }),

  listLegalDocuments: permissionProcedure('read_legal_documents')
    .query(() => {
      const documents = await prisma.legalDocument.findMany({
        include: {
          legalService: { select: { id: true, name: true } }
        }
      });
      return documents;
    }),

  getDocumentDetails: permissionProcedure('read_legal_document')
    .input(z.object({
      id: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const document = await prisma.legalDocument.findUnique({
        where: { id: input.id },
        include: {
          legalService: { select: { id: true, name: true } }
        }
      });
      if (!document) throw new Error('Document not found');
      return { document };
    }),

  createLegalDocument: permissionProcedure('create_legal_document')
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().max(50000),
      legalServiceId: z.string(),
      type: z.enum([
        'summons', 'affidavit', 'submission', 'statement_of_claim', 
        'defence', 'notice_of_appeal', 'summons', 'employment', 'lease', 'sale', 'loan', 'partnership', 'other'
      ])
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await prisma.legalDocument.create({
        data: {
          title: input.title,
          content: input.content,
          legalServiceId: input.legalServiceId,
          type: input.type,
          createdBy: ctx.userId
        }
      });
      return { document, message: 'Legal document created successfully' };
    }),

  updateLegalDocument: permissionProcedure('update_legal_document')
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      legalServiceId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await prisma.legalDocument.update({
        where: { id: input.id },
        data: input
      });
      return { document, message: 'Legal document updated successfully' };
    }),

  deleteLegalDocument: permissionProcedure('delete_legal_document')
    .input(z.object({
      id: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const document = await prisma.legalDocument.delete({
        where: { id: input.id }
      });
      return { message: 'Legal document deleted successfully' };
    }),

  listLegalQueries: permissionProcedure('read_legal_queries')
    .query(() => {
      const queries = await prisma.legalQuery.findMany();
      return queries;
    }),

  createLegalQuery: permissionProcedure('create_legal_query')
    .input(z.object({
      keyword: z.string().min(1).max(100),
      category: z.enum([
        'retrieval', 'analysis', 'drafting', 'validation', 'debate', 'privacy', 
        'audit', 'orchestrate', 'monitor', 'index', 'test'
      ])
    }))
    .mutation(async ({ input, ctx }) => {
      const query = await prisma.legalQuery.create({
        data: {
          keyword: input.keyword,
          category: input.category,
          createdBy: ctx.userId
        }
      });
      return { query, message: 'Legal query created successfully' };
    }),

  searchLegalQueries: permissionProcedure('search_legal_queries')
    .query(() => {
      const queries = await prisma.legalQuery.findMany({
        include: {
          legalService: { select: { id: true, name: true } }
        }
      });
      return queries;
    }),
});
